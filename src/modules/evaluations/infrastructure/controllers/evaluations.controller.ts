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
import { AssignEvaluatorsDto } from '../../application/dtos/assign-evaluator.dto';
import { SubmitEvaluationDto } from '../../application/dtos/submit-evaluation.dto';
import {
  CreateEvaluatorProfileDto,
  UpdateEvaluatorProfileDto,
} from '../../application/dtos/evaluator-profile-crud.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('evaluations')
@ApiBearerAuth()
@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('evaluators/dashboard')
  @Roles('presidente', 'secretaria', 'admin_ti')
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
  @Roles('presidente')
  @Audit('EVALUATORS_SUGGESTED')
  @ApiOperation({
    summary: 'Presidenta sugiere uno o más evaluadores a un protocolo',
  })
  async suggest(@Body() dto: AssignEvaluatorsDto, @Request() req) {
    return this.evaluationsService.suggestEvaluators(dto, req.user.id);
  }

  @Get('pending-suggestions')
  @Roles('secretaria', 'admin_ti')
  @ApiOperation({
    summary:
      'Listar todas las sugerencias de evaluadores pendientes de confirmar',
  })
  async getPendingSuggestions() {
    return this.evaluationsService.getPendingSuggestions();
  }

  @Patch('confirm-assignment')
  @Roles('secretaria', 'admin_ti')
  @Audit('EVALUATORS_ASSIGNED')
  @ApiOperation({
    summary: 'Secretaria confirma las sugerencias y asigna oficialmente',
  })
  async confirm(@Body('assignmentIds') ids: number[], @Request() req) {
    return this.evaluationsService.confirmAssignments(ids, req.user.id);
  }

  @Delete('reject-suggestion/:id')
  @Roles('secretaria', 'admin_ti')
  @Audit('EVALUATION_SUGGESTION_REJECTED')
  @ApiOperation({
    summary: 'Secretaria rechaza (elimina) una sugerencia de la Presidenta',
  })
  async reject(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.rejectSuggestion(id);
  }

  @Get('my-assignments')
  @Roles('evaluador')
  @ApiOperation({
    summary: 'Listar protocolos asignados oficialmente al evaluador logueado',
  })
  async getMyAssignments(@Request() req) {
    return this.evaluationsService.getMyAssignments(req.user.id);
  }

  @Post('submit')
  @Roles('evaluador')
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
  @Roles('presidente', 'admin_ti')
  @Audit('EVALUATOR_PROFILE_CREATED')
  async createProfile(@Body() dto: CreateEvaluatorProfileDto) {
    return this.evaluationsService.createProfile(dto);
  }

  @Patch('profiles/:id')
  @Roles('presidente', 'admin_ti')
  @Audit('EVALUATOR_PROFILE_UPDATED')
  async updateProfile(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEvaluatorProfileDto,
  ) {
    return this.evaluationsService.updateProfile(id, dto);
  }

  @Delete('profiles/:id')
  @Roles('presidente', 'admin_ti')
  @Audit('EVALUATOR_PROFILE_DELETED')
  async deleteProfile(@Param('id', ParseIntPipe) id: number) {
    return this.evaluationsService.deleteProfile(id);
  }
}
