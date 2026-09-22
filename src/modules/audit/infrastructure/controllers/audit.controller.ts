import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuditService } from '../../application/services/audit.service';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener todos los logs de auditoría' })
  async getLogs(@Query() query: Record<string, unknown>) {
    return this.auditService.findAll(query);
  }

  @Get('protocol/:id')
  @ApiOperation({
    summary: 'Obtener el historial de auditoría de un protocolo',
  })
  async getProtocolTrail(@Param('id') id: string) {
    const protocolId = parseInt(id, 10);
    return this.auditService.findProtocolTrail(protocolId);
  }
}
