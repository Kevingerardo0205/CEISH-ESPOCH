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
import { AssignEvaluatorsDto } from '../../application/dtos/assign-evaluator.dto';
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

  @Post('suggest')
  @Permissions(Permission.EVALUATORS_SUGGEST)
  @Audit('EVALUATORS_SUGGESTED')
  @ApiOperation({
    summary: 'Presidenta sugiere uno o más evaluadores a un protocolo',
  })
  async suggest(@Body() dto: AssignEvaluatorsDto, @Request() req) {
    return this.evaluationsService.suggestEvaluators(dto, req.user.id);
  }

  @Get('pending-suggestions')
  @Permissions(Permission.EVALUATORS_ASSIGN)
  @ApiOperation({
    summary:
      'Listar todas las sugerencias de evaluadores pendientes de confirmar',
  })
  async getPendingSuggestions() {
    return this.evaluationsService.getPendingSuggestions();
  }

  @Patch('confirm-assignment')
  @Permissions(Permission.EVALUATORS_ASSIGN)
  @Audit('EVALUATORS_ASSIGNED')
  @ApiOperation({
    summary: 'Secretaria confirma las sugerencias y asigna oficialmente',
  })
  async confirm(@Body('assignmentIds') ids: number[], @Request() req) {
    return this.evaluationsService.confirmAssignments(ids, req.user.id);
  }

  @Delete('reject-suggestion/:id')
  @Permissions(Permission.EVALUATORS_ASSIGN)
  @Audit('EVALUATION_SUGGESTION_REJECTED')
  @ApiOperation({
    summary: 'Secretaria rechaza (elimina) una sugerencia de la Presidenta',
  })
  async reject(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.rejectSuggestion(id);
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
    summary: 'Secretaría asigna exactamente 2 evaluadores pares a un protocolo',
  })
  async assignPeerEvaluators(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AssignPeerEvaluatorsDto,
  ) {
    return this.evaluationsService.assignPeerEvaluators(id, dto);
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
}
