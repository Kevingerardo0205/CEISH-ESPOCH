import { Controller, Get, Post, Body, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { EvaluationsService } from '../../application/services/evaluations.service';
import { AssignEvaluatorsDto } from '../../application/dtos/assign-evaluator.dto';
import { SubmitEvaluationDto } from '../../application/dtos/submit-evaluation.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  @Get('evaluators/dashboard')
  @Roles('presidente', 'admin_ti')
  async getDashboard(@Query('profileId') profileId?: number) {
    return this.evaluationsService.getEvaluatorsDashboard(profileId ? +profileId : undefined);
  }

  @Post('assign')
  @Roles('presidente')
  @Audit('EVALUATORS_ASSIGNED')
  async assign(@Body() dto: AssignEvaluatorsDto, @Request() req) {
    return this.evaluationsService.assignEvaluators(dto, req.user.id);
  }

  @Get('my-assignments')
  @Roles('evaluador')
  async getMyAssignments(@Request() req) {
    return this.evaluationsService.getMyAssignments(req.user.id);
  }

  @Post('submit')
  @Roles('evaluador')
  @Audit('EVALUATION_SUBMITTED')
  async submit(@Body() dto: SubmitEvaluationDto, @Request() req) {
    return this.evaluationsService.submitEvaluation(dto, req.user.id);
  }

  @Get('profiles')
  async getProfiles() {
    return this.evaluationsService.getProfiles();
  }
}
