import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProtocolRepository } from '../../domain/ports/protocol.repository.port';
import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { StudyTypeOrmEntity } from '../../infrastructure/database/study-type.entity.orm';
import { CreateProtocolDto } from '../dtos/create-protocol.dto';
import { QueryProtocolDto } from '../dtos/query-protocol.dto';
import { InvestigatorOrmEntity } from '../../infrastructure/database/investigator.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { InvestigatorRole } from '../../domain/enums/investigator-role.enum';
import { ParticipatingInstitutionOrmEntity } from '../../infrastructure/database/participating-institution.entity.orm';
import { ProtocolMapper } from '../mappers/protocol.mapper';
import { paginate } from '../../../../shared/db/pagination.helper';
import { ReceptionService } from '../../../reception/application/services/reception.service';

@Injectable()
export class ProtocolsService {
  constructor(
    private readonly protocolsRepository: IProtocolRepository,
    @InjectRepository(StudyTypeOrmEntity)
    private readonly studyTypeRepository: Repository<StudyTypeOrmEntity>,
    @InjectRepository(InvestigatorOrmEntity)
    private readonly investigatorRepository: Repository<InvestigatorOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ParticipatingInstitutionOrmEntity)
    private readonly institutionRepository: Repository<ParticipatingInstitutionOrmEntity>,
    
    @Inject(forwardRef(() => ReceptionService))
    private readonly receptionService: ReceptionService,
  ) {}

  async findAll(query: QueryProtocolDto) {
    const [data, total] = await this.protocolsRepository.findAll(query);
    return paginate(
      data.map(p => ProtocolMapper.toResponse(p)),
      total,
      query
    );
  }

  async findOne(id: number) {
    const protocol = await this.protocolsRepository.findById(id);
    if (!protocol) throw new NotFoundException(`Protocol with ID ${id} not found`);
    return protocol;
  }

  /**
   * Refactored Create: Only base data + delegate reception
   */
  async create(dto: CreateProtocolDto, userId: number) {
    const studyType = await this.studyTypeRepository.findOne({ where: { id: dto.studyTypeId } });
    if (!studyType) throw new NotFoundException('Study Type not found');

    const principalInvestigator = await this.userRepository.findOne({ where: { id: dto.principalInvestigatorId } });
    if (!principalInvestigator) throw new NotFoundException('Principal Investigator (User) not found');

    // 1. Save base protocol
    const { investigators, institutions, ...protocolData } = dto;
    
    const protocolEntity: Partial<ProtocolOrmEntity> = {
      ...protocolData,
      currentVersion: 1,
      version: '1.0',
    };

    try {
      const savedProtocol = await this.protocolsRepository.save(protocolEntity);

      // 2. Auto-insert Principal Investigator
      await this.investigatorRepository.save({
        protocolId: savedProtocol.id,
        userId: principalInvestigator.id,
        fullName: principalInvestigator.fullName,
        identification: principalInvestigator.nationalId,
        position: principalInvestigator.position || 'Investigador',
        institution: principalInvestigator.institution || 'ESPOCH',
        email: principalInvestigator.institutionalEmail,
        phone: principalInvestigator.phone || '',
        education: 'Información en perfil',
        role: InvestigatorRole.PRINCIPAL,
      } as any);

      // 3. Save co-investigators if any
      if (investigators && investigators.length > 0) {
        for (const inv of investigators) {
          await this.investigatorRepository.save({
            ...inv,
            protocolId: savedProtocol.id,
            role: InvestigatorRole.CO_INVESTIGADOR,
          } as any);
        }
      }

      // 4. Save institutions if any
      if (institutions && institutions.length > 0) {
        for (const inst of institutions) {
          await this.institutionRepository.save({
            ...inst,
            protocolId: savedProtocol.id,
          } as any);
        }
      }

      // 5. DELEGATE TO RECEPTION SERVICE (PET 4.1)
      await this.receptionService.iniciarRecepcion(savedProtocol.id, userId);

      return savedProtocol;
    } catch (error: any) {
      if (error.code === '23505') {
        throw new ConflictException('Conflicto al crear el protocolo.');
      }
      throw error;
    }
  }
}
