import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ParseBoolPipe,
  BadRequestException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ProtocolsService } from '../../application/services/protocols.service';
import { RequirementsService } from '../../application/services/requirements.service';
import { CreateProtocolDto } from '../../application/dtos/create-protocol.dto';
import { QueryProtocolDto } from '../../application/dtos/query-protocol.dto';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { ProtocolMapper } from '../../application/mappers/protocol.mapper';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiConsumes,
} from '@nestjs/swagger';
import { StudyTypeCode } from '../../domain/enums/study-type.enum';
import { UploadDocumentDto } from '../../../reception/application/dtos/upload-document.dto';

@ApiTags('protocols')
@ApiBearerAuth()
@Controller('protocols')
@UseGuards(JwtAuthGuard)
export class ProtocolController {
  constructor(
    private readonly protocolsService: ProtocolsService,
    private readonly requirementsService: RequirementsService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Listar todos los protocolos' })
  async findAll(@Query() query: QueryProtocolDto) {
    return this.protocolsService.findAll(query);
  }

  // Las rutas estáticas deben ir ANTES de las rutas dinámicas como :id
  @Get('study-types')
  @ApiOperation({ summary: 'Obtener catálogo de tipos de estudio activos' })
  async getStudyTypes() {
    return this.protocolsService.findAllStudyTypes();
  }

  @Get('risk-levels')
  @ApiOperation({ summary: 'Obtener catálogo de niveles de riesgo activos' })
  async getRiskLevels() {
    return this.protocolsService.findAllRiskLevels();
  }

  @Get('mis-protocolos')
  @ApiOperation({ summary: 'Listar los protocolos del investigador logueado' })
  async findMyProtocols(@Query() query: QueryProtocolDto, @Request() req) {
    query.investigatorId = req.user.id;
    return this.protocolsService.findAll(query);
  }

  @Get('checklist/:id')
  @ApiOperation({
    summary: 'Obtener el checklist de requisitos de un protocolo',
  })
  async getChecklist(@Param('id') id: string, @Request() req) {
    const protocolId = parseInt(id, 10);
    const protocol = await this.protocolsService.findOne(protocolId);

    // Validar propiedad
    const isOwner = protocol.principalInvestigatorId === req.user.id;
    const isCoInvestigator = protocol.investigators?.some(
      (inv) => inv.userId === req.user.id,
    );

    if (!isOwner && !isCoInvestigator) {
      throw new BadRequestException(
        'No tienes permiso para ver el checklist de este protocolo',
      );
    }

    return protocol.checklist || [];
  }

  @Post(':id/upload-document')
  @ApiOperation({
    summary: 'Subir un documento asociado a un requisito (Investigador)',
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (!file.originalname.match(/\.(pdf)$/)) {
          return cb(
            new BadRequestException('Solo se permiten archivos PDF'),
            false,
          );
        }
        cb(null, true);
      },
    }),
  )
  @Audit('DOCUMENT_UPLOADED')
  async uploadDocument(
    @Param('id') id: string,
    @Body() dto: UploadDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
  ) {
    if (!file) {
      throw new BadRequestException('El archivo PDF es obligatorio');
    }

    const protocolId = parseInt(id, 10);
    dto.protocolId = protocolId;

    // El 'path' en la DB guardará el nombre del archivo en disco
    dto.path = file.filename;
    dto.fileName = file.originalname;
    dto.sizeBytes = file.size.toString();

    const protocol = await this.protocolsService.findOne(protocolId);

    // Validar propiedad
    const isOwner = protocol.principalInvestigatorId === req.user.id;
    const isCoInvestigator = protocol.investigators?.some(
      (inv) => inv.userId === req.user.id,
    );

    if (!isOwner && !isCoInvestigator) {
      throw new BadRequestException(
        'No tienes permiso para subir documentos a este protocolo',
      );
    }

    return this.protocolsService.uploadDocument(dto, req.user.id);
  }

  @Get('requirements')
  @ApiOperation({
    summary: 'Obtener requisitos dinámicos según el tipo de estudio y flags',
  })
  @ApiQuery({ name: 'tipo', enum: StudyTypeCode })
  @ApiQuery({ name: 'muestras', type: Boolean, required: false })
  @ApiQuery({ name: 'vulnerable', type: Boolean, required: false })
  @ApiQuery({ name: 'multicentrico', type: Boolean, required: false })
  @ApiQuery({ name: 'riesgoMayor', type: Boolean, required: false })
  @ApiQuery({ name: 'institucionesPublicas', type: Boolean, required: false })
  async getRequirements(
    @Query('tipo') tipo: StudyTypeCode,
    @Query('muestras') muestras?: string,
    @Query('vulnerable') vulnerable?: string,
    @Query('multicentrico') multicentrico?: string,
    @Query('riesgoMayor') riesgoMayor?: string,
    @Query('institucionesPublicas') institucionesPublicas?: string,
  ) {
    return this.requirementsService.calcularRequeridos(tipo, {
      muestras: muestras === 'true',
      vulnerable: vulnerable === 'true',
      multicentrico: multicentrico === 'true',
      riesgoMayor: riesgoMayor === 'true',
      institucionesPublicas: institucionesPublicas === 'true',
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un protocolo por ID' })
  async findOne(@Param('id') id: string) {
    // Si llegamos aquí con 'risk-levels', es que NestJS no hizo match arriba
    if (id === 'risk-levels' || id === 'study-types') {
      throw new BadRequestException(
        `Ruta crítica detectada en findOne: ${id}. Esto no debería pasar.`,
      );
    }

    const numericId = parseInt(id, 10);
    if (isNaN(numericId)) {
      throw new BadRequestException('ID de protocolo debe ser un número');
    }

    const protocol = await this.protocolsService.findOne(numericId);
    return ProtocolMapper.toResponse(protocol);
  }

  @Post(':id/submit')
  @ApiOperation({
    summary: 'Enviar el protocolo para revisión técnica (Investigador)',
  })
  @Audit('PROTOCOL_SUBMITTED')
  async submit(@Param('id') id: string, @Request() req) {
    const protocolId = parseInt(id, 10);
    const protocol = await this.protocolsService.findOne(protocolId);

    // Validar propiedad
    const isOwner = protocol.principalInvestigatorId === req.user.id;
    if (!isOwner) {
      throw new BadRequestException(
        'Solo el investigador principal puede enviar el protocolo para revisión',
      );
    }

    return this.protocolsService.submit(protocolId);
  }

  @Post(':id/accept-timeline')
  @ApiOperation({
    summary:
      'Aceptar el sometimiento a los tiempos y reglamentos del comité (Investigador)',
  })
  @Audit('PROTOCOL_TIMELINE_ACCEPTED')
  async acceptTimeline(@Param('id') id: string, @Request() req) {
    const protocolId = parseInt(id, 10);
    const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
    return this.protocolsService.acceptTimeline(
      protocolId,
      req.user.id,
      ipAddress,
    );
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo protocolo' })
  @Audit('PROTOCOL_CREATED')
  async create(@Body() dto: CreateProtocolDto, @Request() req) {
    const ipAddress = req.ip || req.connection.remoteAddress;
    const protocol = await this.protocolsService.create(
      dto,
      req.user.id,
      ipAddress,
    );
    return ProtocolMapper.toResponse(protocol);
  }
}
