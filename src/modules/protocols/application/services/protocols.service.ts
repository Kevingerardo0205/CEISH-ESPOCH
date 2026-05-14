import {
  Injectable,
  NotFoundException,
  ConflictException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IProtocolRepository } from '../../domain/ports/protocol.repository.port';
import { ProtocolOrmEntity } from '../../infrastructure/database/protocol.entity.orm';
import { StudyTypeOrmEntity } from '../../infrastructure/database/study-type.entity.orm';
import { RiskLevelOrmEntity } from '../../infrastructure/database/risk-level.entity.orm';
import { CreateProtocolDto } from '../dtos/create-protocol.dto';
import { QueryProtocolDto } from '../dtos/query-protocol.dto';
import { InvestigatorOrmEntity } from '../../infrastructure/database/investigator.entity.orm';
import { UserOrmEntity } from '../../../auth/infrastructure/database/user.entity.orm';
import { InvestigatorRole } from '../../domain/enums/investigator-role.enum';
import { ParticipatingInstitutionOrmEntity } from '../../infrastructure/database/participating-institution.entity.orm';
import { ProtocolRequirementOrmEntity } from '../../infrastructure/database/protocol-requirement.entity.orm';
import { ProtocolMapper } from '../mappers/protocol.mapper';
import { paginate } from '../../../../shared/db/pagination.helper';
import { ReceptionService } from '../../../reception/application/services/reception.service';
import { RequirementsService } from './requirements.service';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';

@Injectable()
export class ProtocolsService {
  constructor(
    private readonly protocolsRepository: IProtocolRepository,
    @InjectRepository(StudyTypeOrmEntity)
    private readonly studyTypeRepository: Repository<StudyTypeOrmEntity>,
    @InjectRepository(RiskLevelOrmEntity)
    private readonly riskLevelRepository: Repository<RiskLevelOrmEntity>,
    @InjectRepository(InvestigatorOrmEntity)
    private readonly investigatorRepository: Repository<InvestigatorOrmEntity>,
    @InjectRepository(UserOrmEntity)
    private readonly userRepository: Repository<UserOrmEntity>,
    @InjectRepository(ParticipatingInstitutionOrmEntity)
    private readonly institutionRepository: Repository<ParticipatingInstitutionOrmEntity>,
    @InjectRepository(ProtocolRequirementOrmEntity)
    private readonly requirementRepository: Repository<ProtocolRequirementOrmEntity>,

    private readonly requirementsService: RequirementsService,

    @Inject(forwardRef(() => ReceptionService))
    private readonly receptionService: ReceptionService,
  ) {}

  async findAll(query: QueryProtocolDto) {
    const [data, total] = await this.protocolsRepository.findAll(query);
    return paginate(
      data.map((p) => ProtocolMapper.toResponse(p)),
      total,
      query,
    );
  }

  async findOne(id: number) {
    if (!id || isNaN(id)) {
      throw new BadRequestException('ID de protocolo inválido');
    }
    const protocol = await this.protocolsRepository.findById(id);
    if (!protocol)
      throw new NotFoundException(`Protocol with ID ${id} not found`);
    return protocol;
  }

  async findAllStudyTypes() {
    return this.studyTypeRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findAllRiskLevels() {
    return this.riskLevelRepository.find({
      where: { isActive: true },
      order: { id: 'ASC' },
    });
  }

  /**
   * Refactored Create: Fix for NaN/Null ID issue and robust persistence
   */
  async create(dto: CreateProtocolDto, userId: number, ipAddress: string) {
    // 1. Validaciones iniciales
    if (!dto.isAffidavitAccepted) {
      throw new BadRequestException(
        'Debe aceptar la declaración jurada antes de enviar el protocolo',
      );
    }

    const studyType = await this.studyTypeRepository.findOne({
      where: { id: dto.studyTypeId },
    });
    if (!studyType)
      throw new NotFoundException('Tipo de estudio no encontrado');

    const principalInvestigator = await this.userRepository.findOne({
      where: { id: dto.principalInvestigatorId },
      relations: ['investigatorProfile'],
    });
    if (!principalInvestigator)
      throw new NotFoundException('Investigador principal no encontrado');

    // 2. Limpieza de datos (Evitar que 'id' u otros campos basura se filtren desde el DTO)
    const { investigators, institutions, ...cleanData } = dto;

    // Eliminamos explícitamente cualquier 'id' que pueda venir en el spread
    const protocolToSave = this.protocolsRepository.save({
      title: cleanData.title,
      studyTypeId: cleanData.studyTypeId,
      principalInvestigatorId: cleanData.principalInvestigatorId,
      riskLevelId: cleanData.riskLevelId,
      version: cleanData.version || '1.0',
      financingAmount: cleanData.financingAmount,
      financingSources: cleanData.financingSources,
      sponsorRuc: cleanData.sponsorRuc,
      sponsorPhone: cleanData.sponsorPhone,
      sponsorAddress: cleanData.sponsorAddress,
      sponsorWeb: cleanData.sponsorWeb,
      sponsorExecutingAgency: cleanData.sponsorExecutingAgency,
      estimatedStartDate: cleanData.estimatedStartDate,
      estimatedEndDate: cleanData.estimatedEndDate,
      geographicCoverage: cleanData.geographicCoverage,
      studyDurationMonths: cleanData.studyDurationMonths,
      isVulnerablePopulation: cleanData.isVulnerablePopulation || false,
      usesBiologicalSamples: cleanData.usesBiologicalSamples || false,
      isMulticentric: cleanData.isMulticentric || false,
      hasExternalInstitutions: cleanData.hasExternalInstitutions || false,
      isIndigenousPopulation: cleanData.isIndigenousPopulation || false,
      isAffidavitAccepted: true,
      affidavitDate: new Date(),
      affidavitIp: ipAddress,
      currentVersion: 1,
    } as any);

    try {
      // 3. Persistencia Core
      const savedProtocol = await protocolToSave;

      if (!savedProtocol || !savedProtocol.id) {
        throw new Error(
          'Error crítico: El protocolo fue guardado pero no se obtuvo un ID válido.',
        );
      }

      // 4. Investigador Principal (Fuente de verdad E3)
      const piRecord = await this.investigatorRepository.save({
        protocolId: savedProtocol.id,
        userId: principalInvestigator.id,
        fullName: principalInvestigator.fullName,
        identification: principalInvestigator.nationalId,
        position:
          principalInvestigator.investigatorProfile?.position || 'Investigador',
        institution:
          principalInvestigator.investigatorProfile?.institution || 'ESPOCH',
        email: principalInvestigator.institutionalEmail,
        phone: principalInvestigator.investigatorProfile?.phone || '',
        education: 'Información en perfil',
        role: InvestigatorRole.PRINCIPAL,
      } as any);

      // Actualizar referencia en protocolo
      await this.protocolsRepository.update(savedProtocol.id, {
        principalInvestigatorRecordId: piRecord.id,
      });

      // 5. Co-investigadores e Instituciones
      if (investigators?.length > 0) {
        const otherInv = investigators
          .filter((inv) => inv.role !== InvestigatorRole.PRINCIPAL)
          .map((inv) => ({
            ...inv,
            protocolId: savedProtocol.id,
            role: inv.role || InvestigatorRole.CO_INVESTIGADOR,
          }));
        if (otherInv.length > 0)
          await this.investigatorRepository.save(otherInv as any);
      }

      if (institutions?.length > 0) {
        const instToSave = institutions.map((inst) => ({
          ...inst,
          protocolId: savedProtocol.id,
        }));
        await this.institutionRepository.save(instToSave as any);
      }

      // 6. Checklist Dinámico
      const reqs = await this.requirementsService.calcularRequeridos(
        studyType.code as StudyTypeCode,
        {
          muestras: savedProtocol.usesBiologicalSamples,
          vulnerable: savedProtocol.isVulnerablePopulation,
          multicentrico: savedProtocol.isMulticentric,
          institucionesPublicas: cleanData.hasExternalInstitutions,
          poblacionIndigena: savedProtocol.isIndigenousPopulation,
        },
      );

      const checklist = reqs.map((r) => ({
        protocolId: savedProtocol.id,
        requirementCode: r.code,
        requirementName: r.name,
        status: 'NO_PRESENTADO',
      }));
      await this.requirementRepository.save(checklist as any);

      // 7. Iniciar Recepción
      await this.receptionService.iniciarRecepcion(savedProtocol.id, userId);

      return await this.findOne(savedProtocol.id);
    } catch (error: any) {
      console.error('Error in ProtocolsService.create:', error);
      if (error.code === '23505')
        throw new ConflictException('Conflicto: Código o registro duplicado.');
      throw error;
    }
  }
}
