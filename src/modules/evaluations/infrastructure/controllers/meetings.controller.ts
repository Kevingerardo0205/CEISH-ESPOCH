import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import { CreateMeetingUseCase } from '../../application/services/create-meeting.use-case';
import { CalculateMeetingDatesService } from '../../application/services/calculate-meeting-dates.service';
import { CreateMeetingDto } from '../../application/dtos/create-meeting.dto';
import { CalculateEvalDateDto } from '../../application/dtos/calculate-eval-date.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { RoleCode } from '../../../auth/domain/enums/role.enum';
import type { IMeetingRepositoryPort } from '../../domain/ports/meeting-repository.port';
import type { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';

@ApiTags('meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations/meetings')
export class MeetingsController {
  constructor(
    private readonly createMeetingUseCase: CreateMeetingUseCase,
    private readonly calculateDatesService: CalculateMeetingDatesService,
    @Inject('IMeetingRepositoryPort')
    private readonly meetingRepository: IMeetingRepositoryPort,
    @Inject('IMeetingPdfGeneratorPort')
    private readonly pdfGenerator: IMeetingPdfGeneratorPort,
  ) {}

  @Post('calculate-eval-date')
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI, 'ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Calcular fecha sugerida de entrega de evaluaciones',
  })
  calculateEvalDate(@Body() dto: CalculateEvalDateDto) {
    const meetingDate = new Date(dto.meetingDate);
    const suggestedEvalSubmissionDeadline =
      this.calculateDatesService.calculateSuggestedEvalDeadline(meetingDate);

    return {
      statusCode: HttpStatus.OK,
      message: 'Fecha de entrega de evaluación calculada exitosamente',
      data: {
        meetingDate: dto.meetingDate,
        suggestedEvalSubmissionDeadline:
          suggestedEvalSubmissionDeadline.toISOString(),
      },
    };
  }

  @Post()
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI, 'ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Crear y agendar una convocatoria a Pleno con Orden del Día',
  })
  async createMeeting(@Body() dto: CreateMeetingDto) {
    const params = {
      sessionType: dto.sessionType,
      meetingDate: new Date(dto.meetingDate),
      evalSubmissionDeadline: dto.evalSubmissionDeadline
        ? new Date(dto.evalSubmissionDeadline)
        : undefined,
      locationId: dto.locationId,
      protocolVersionIds: dto.protocolVersionIds,
      followUpReportIds: dto.followUpReportIds,
    };

    const result = await this.createMeetingUseCase.execute(params);

    return {
      statusCode: HttpStatus.CREATED,
      message: `Convocatoria ${result.meetingNumber} creada y agendada exitosamente`,
      data: {
        id: result.id,
        meetingNumber: result.meetingNumber,
        sessionType: dto.sessionType,
        meetingDate: dto.meetingDate,
        evalSubmissionDeadline: dto.evalSubmissionDeadline,
        agendaPdfUrl: result.pdfUrl,
      },
    };
  }

  @Get(':id')
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    'ADMIN',
    RoleCode.EVALUADOR,
  )
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Obtener detalle estructurado de una convocatoria por ID',
  })
  async getMeeting(@Param('id') id: string) {
    const meeting = await this.meetingRepository.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Convocatoria con ID ${id} no encontrada.`);
    }

    return {
      statusCode: HttpStatus.OK,
      message: 'Convocatoria obtenida exitosamente',
      data: meeting,
    };
  }

  @Get(':id/pdf')
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    'ADMIN',
    RoleCode.EVALUADOR,
  )
  @ApiOperation({
    summary: 'Descargar el PDF oficial del Orden del Día de la Convocatoria',
  })
  async downloadMeetingPdf(
    @Param('id') id: string,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const meeting = await this.meetingRepository.findById(id);
    if (!meeting) {
      throw new NotFoundException(`Convocatoria con ID ${id} no encontrada.`);
    }

    const uploadDir = path.resolve(process.cwd(), 'uploads', 'convocatorias');
    const fileName = `convocatoria-${meeting.numeroConvocatoria || id}-orden-del-dia.pdf`;
    const filePath = path.join(uploadDir, fileName);

    let pdfBuffer: Buffer;
    if (fs.existsSync(filePath)) {
      pdfBuffer = fs.readFileSync(filePath);
    } else {
      await this.pdfGenerator.generateAgendaPdf(id);
      if (fs.existsSync(filePath)) {
        pdfBuffer = fs.readFileSync(filePath);
      } else {
        pdfBuffer = Buffer.from('%PDF-1.4 Default PDF buffer');
      }
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${fileName}"`,
    });

    return new StreamableFile(pdfBuffer);
  }
}
