import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import {
  AssignEvaluatorsDto,
  ReassignEvaluatorDto,
} from '../../application/dtos/evaluator-dtos';
import { AssignEvaluatorsUseCase } from '../../application/use-cases/assign-evaluators.use-case';
import { ReassignEvaluatorUseCase } from '../../application/use-cases/reassign-evaluator.use-case';
import { SubmitEvaluationUseCase } from '../../application/use-cases/submit-evaluation.use-case';

import { JwtPayload } from '../../../auth/infrastructure/strategies/jwt.strategy';

@Controller('evaluations')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EvaluationAssignmentController {
  constructor(
    private readonly assignEvaluatorsUseCase: AssignEvaluatorsUseCase,
    private readonly reassignEvaluatorUseCase: ReassignEvaluatorUseCase,
    private readonly submitEvaluationUseCase: SubmitEvaluationUseCase,
  ) {}

  @Post('assign')
  @Roles('SECRETARIA', 'PRESIDENTE')
  public async assignEvaluators(@Body() dto: AssignEvaluatorsDto) {
    return await this.assignEvaluatorsUseCase.execute(dto);
  }

  @Post('reassign')
  @Roles('SECRETARIA', 'PRESIDENTE')
  public async reassignEvaluator(
    @Body() dto: ReassignEvaluatorDto,
    @Request() req?: { user?: JwtPayload },
  ) {
    const adminUserId = req?.user?.id ?? 1;
    return await this.reassignEvaluatorUseCase.execute(dto, adminUserId);
  }

  @Get('completion-status/:protocolId')
  @Roles('SECRETARIA', 'PRESIDENTE', 'EVALUADOR')
  public async getCompletionStatus(@Param('protocolId') protocolId: string) {
    const isComplete =
      await this.submitEvaluationUseCase.isCompletion100Percent(protocolId);
    return {
      protocolId,
      isCompletion100Percent: isComplete,
    };
  }
}
