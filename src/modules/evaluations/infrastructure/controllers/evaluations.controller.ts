import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { EvaluationsService } from '../../application/services/evaluations.service';
import { EvaluationConsolidationService } from '../../application/services/evaluation-consolidation.service';
import { SubmitEvaluationDto } from '../../application/dtos/submit-evaluation.dto';
import {
  CreateEvaluatorProfileDto,
  UpdateEvaluatorProfileDto,
} from '../../application/dtos/evaluator-profile-crud.dto';
import { AssignPeerEvaluatorsDto } from '../../application/dtos/assign-peer-evaluators.dto';
import { SubmitPeerRiskDto } from '../../application/dtos/submit-peer-risk.dto';

import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { PermissionsGuard } from '../../../../shared/guards/permissions.guard';
import { Permissions } from '../../../../shared/decorators/permissions.decorator';
import { Permission } from '../../../../shared/enums/permission.enum';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('evaluations')
@ApiBearerAuth()
@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class EvaluationsController {
  constructor(
    private readonly evaluationsService: EvaluationsService,
    private readonly consolidationService: EvaluationConsolidationService,
  ) {}

  @Get('consolidate/:protocolId')
  @Permissions(Permission.EVALUACION_INFORMES)
  @ApiOperation({
    summary: 'Consolidar informes de evaluación para un protocolo (Anexo 12)',
  })
  async consolidate(@Param('protocolId', ParseIntPipe) protocolId: number) {
    return this.consolidationService.consolidate(protocolId);
  }

  @Get('evaluators/dashboard')
  @Permissions(Permission.EVALUATORS_WORKLOAD_VIEW)
  @ApiOperation({
    summary: 'Obtener carga de trabajo de evaluadores (Dashboard Presidenta)',
  })
  @ApiQuery({
    name: 'profileId',
    required: false,
    description: 'Filtrar por ID de perfil (Salud, Jurídico, etc.)',
  })
  async getDashboard(@Query('profileId') profileId?: number) {
    return this.evaluationsService.getEvaluatorsDashboard(
      profileId ? +profileId : undefined,
    );
  }

  @Get('my-assignments')
  @Permissions(Permission.EVALUATION_VIEW_MINE)
  @ApiOperation({
    summary: 'Listar protocolos asignados oficialmente al evaluador logueado',
  })
  async getMyAssignments(@Request() req) {
    return this.evaluationsService.getMyAssignments(req.user.id);
  }

  @Post('submit')
  @Permissions(Permission.EVALUATION_FILL)
  @Audit('EVALUATION_SUBMITTED')
  @ApiOperation({ summary: 'Evaluador envía dictamen final de evaluación' })
  async submit(@Body() dto: SubmitEvaluationDto, @Request() req) {
    return this.evaluationsService.submitEvaluation(dto, req.user.id);
  }

  @Get('profiles')
  @ApiOperation({ summary: 'Listar todos los perfiles de evaluadores' })
  async getProfiles() {
    return this.evaluationsService.getProfiles();
  }

  @Post('profiles')
  @Permissions(Permission.PERMISSIONS_MANAGE)
  @Audit('EVALUATOR_PROFILE_CREATED')
  async createProfile(@Body() dto: CreateEvaluatorProfileDto) {
    return this.evaluationsService.createProfile(dto);
  }

  @Patch('profiles/:id')
  @Permissions(Permission.PERMISSIONS_MANAGE)
  @Audit('EVALUATOR_PROFILE_UPDATED')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEvaluatorProfileDto,
  ) {
    return this.evaluationsService.updateProfile(id, dto);
  }

  @Delete('profiles/:id')
  @Permissions(Permission.PERMISSIONS_MANAGE)
  @Audit('EVALUATOR_PROFILE_DELETED')
  async deleteProfile(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.deleteProfile(id);
  }

  @Get('protocols/pending-peer-assignment')
  @Permissions(Permission.EVALUATORS_ASSIGN)
  @ApiOperation({
    summary:
      'Listar protocolos completados pendientes de asignación de pares evaluadores (Secretaría)',
  })
  async getProtocolsPendingPeerAssignment() {
    return this.evaluationsService.getProtocolsPendingPeerAssignment();
  }

  @Post('protocols/:id/assign-peer-evaluators')
  @Permissions(Permission.EVALUATORS_ASSIGN)
  @Audit('PEER_EVALUATORS_ASSIGNED')
  @ApiOperation({
    summary:
      'Secretaría asigna evaluadores al protocolo (mínimo 4). 2 aleatorios para riesgo + todos para evaluación ética.',
  })
  async assignPeerEvaluators(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPeerEvaluatorsDto,
    @Request() req,
  ) {
    return this.evaluationsService.assignPeerEvaluators(id, dto, req.user.id);
  }

  @Get('peer-assignments/my-pending')
  @Permissions(Permission.EVALUATION_VIEW_MINE)
  @ApiOperation({
    summary:
      'Listar asignaciones de riesgo pendientes para el evaluador par logueado',
  })
  async getMyPendingPeerAssignments(@Request() req) {
    return this.evaluationsService.getMyPendingPeerAssignments(req.user.id);
  }

  @Post('peer-assignments/:id/submit-risk')
  @Permissions(Permission.EVALUATION_FILL)
  @Audit('PEER_RISK_SUBMITTED')
  @ApiOperation({
    summary:
      'Evaluador par envía su propuesta de nivel de riesgo para el protocolo',
  })
  async submitPeerRiskLevel(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SubmitPeerRiskDto,
    @Request() req,
  ) {
    return this.evaluationsService.submitPeerRiskLevel(id, req.user.id, dto);
  }

  @Get('evaluators/active')
  @Permissions(Permission.EVALUATORS_ASSIGN, Permission.EVALUATORS_SUGGEST)
  @ApiOperation({
    summary:
      'Listar evaluadores activos del sistema para el modal de asignación de pares',
  })
  async getActiveEvaluators() {
    return this.evaluationsService.getActiveEvaluators();
  }

  @Get('submit/protocol/:protocolId')
  @ApiOperation({
    summary: 'Obtener información de evaluación/conformidad para un protocolo',
  })
  async getSubmitProtocolInfo(
    @Param('protocolId', ParseIntPipe) protocolId: number,
    @Request() req,
  ) {
    return this.evaluationsService.getSubmitProtocolInfo(
      protocolId,
      req.user.id,
    );
  }

  @Get(':id/checklist-details')
  @Permissions(Permission.EVALUATION_VIEW_MINE)
  @ApiOperation({
    summary:
      'Consultar los ítems relacionales del checklist (Anexo 9) de una evaluación específica. ' +
      'Retorna cada ítem enriquecido con su descripción canónica y estadísticas de cumplimiento por criterio técnico (Ética, Metodología, Jurídica).',
  })
  async getChecklistDetails(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.getEvaluationChecklistDetails(id);
  }

  @Get(':id/document')
  @Permissions(Permission.EVALUATION_VIEW_MINE)
  @ApiOperation({
    summary:
      'Obtener URL firmada (30 min) para descargar el PDF del Anexo 9 auto-generado. ' +
      'Solo disponible para evaluaciones de tipo Revisión Expedita. El PDF se almacena en Cloudflare R2.',
  })
  async getEvaluationDocument(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.getEvaluationDocumentUrl(id);
  }

  @Get(':id/document/docx')
  @Permissions(Permission.EVALUATION_VIEW_MINE)
  @ApiOperation({
    summary:
      'Obtener URL firmada (30 min) para descargar el DOCX Word del Anexo 9 auto-generado. ' +
      'Solo disponible para evaluaciones de tipo Revisión Expedita. El DOCX se almacena en Cloudflare R2. ' +
      'El campo filename de la respuesta indica el nombre sugerido para guardar el archivo.',
  })
  async getEvaluationDocumentDocx(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.getEvaluationDocxUrl(id);
  }

  @Get('protocol/:protocolId/observations')
  @ApiOperation({
    summary:
      'Obtener observaciones detalladas y consolidadas de cada evaluador para un protocolo (Investigador/Secretaría)',
  })
  async getProtocolObservationsForInvestigator(
    @Param('protocolId', ParseIntPipe) protocolId: number,
    @Request() req,
  ) {
    return this.evaluationsService.getObservationsForInvestigator(
      protocolId,
      req.user.id,
      req.user.permissions,
    );
  }
}
