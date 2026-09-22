import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  ParseIntPipe,
} from '@nestjs/common';
import { JwtPayload } from '../../../../modules/auth/infrastructure/strategies/jwt.strategy';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CallsService } from '../../application/services/calls.service';
import { CreateCallDto } from '../../application/dtos/create-call.dto';
import {
  CreatePlaceDto,
  UpdatePlaceDto,
} from '../../application/dtos/create-place.dto';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { Audit } from '../../../../shared/decorators/audit.decorator';
import { RoleCode } from '../../../auth/domain/enums/role.enum';

@ApiTags('calls')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('evaluations/calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  // ==========================================
  // PLACES (LUGARES) ENDPOINTS
  // ==========================================

  @Post('places')
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
  @Audit('PLACE_CREATED')
  @ApiOperation({
    summary: 'Crear un nuevo lugar de reunión (Secretaría/Presidente)',
  })
  async createPlace(@Body() dto: CreatePlaceDto) {
    return this.callsService.createPlace(dto);
  }

  @Get('places')
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    RoleCode.EVALUADOR,
  )
  @ApiOperation({ summary: 'Listar todos los lugares de reunión' })
  async findAllPlaces() {
    return this.callsService.findAllPlaces();
  }

  @Get('places/:id')
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    RoleCode.EVALUADOR,
  )
  @ApiOperation({ summary: 'Obtener un lugar de reunión por ID' })
  async findPlaceById(@Param('id', ParseIntPipe) id: number) {
    return this.callsService.findPlaceById(id);
  }

  @Patch('places/:id')
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
  @Audit('PLACE_UPDATED')
  @ApiOperation({
    summary: 'Actualizar un lugar de reunión (Secretaría/Presidente)',
  })
  async updatePlace(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlaceDto,
  ) {
    return this.callsService.updatePlace(id, dto);
  }

  @Delete('places/:id')
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
  @Audit('PLACE_DELETED')
  @ApiOperation({
    summary: 'Eliminar/desactivar un lugar de reunión (Secretaría/Presidente)',
  })
  async deletePlace(@Param('id', ParseIntPipe) id: number) {
    await this.callsService.deletePlace(id);
    return { message: 'Lugar de reunión desactivado exitosamente.' };
  }

  // ==========================================
  // CONVOCATORIAS (CALLS) ENDPOINTS
  // ==========================================

  @Get('protocols/pending')
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
  @ApiOperation({
    summary:
      'Obtener listado de protocolos pendientes y priorizados para agendar',
  })
  async getPendingProtocols() {
    return this.callsService.getPendingProtocolsForCall();
  }

  @Post()
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
  @Audit('CALL_CREATED')
  @ApiOperation({
    summary: 'Crear una Convocatoria a Pleno y notificar a los miembros',
  })
  async createCall(
    @Body() dto: CreateCallDto,
    @Request() req: Request & { user: JwtPayload },
  ) {
    return this.callsService.createCall(dto, req.user.id);
  }

  @Get()
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    RoleCode.EVALUADOR,
  )
  @ApiOperation({ summary: 'Listar todas las convocatorias registradas' })
  async findAllCalls() {
    return this.callsService.findAllCalls();
  }

  @Get(':id')
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    RoleCode.EVALUADOR,
  )
  @ApiOperation({ summary: 'Obtener el detalle de una convocatoria por ID' })
  async findCallById(@Param('id', ParseIntPipe) id: number) {
    return this.callsService.findCallById(id);
  }

  @Get(':id/protocols')
  @Roles(
    RoleCode.SECRETARIA,
    RoleCode.PRESIDENTE,
    RoleCode.ADMIN_TI,
    RoleCode.EVALUADOR,
  )
  @ApiOperation({
    summary: 'Listar protocolos agendados en una convocatoria específica',
  })
  async findProtocolsByCallId(@Param('id', ParseIntPipe) id: number) {
    return this.callsService.findProtocolsByCallId(id);
  }

  // ==========================================
  // SIGN MINUTES (ACTAS) ENDPOINTS
  // ==========================================

  @Post('minutes/:id/sign')
  @Roles(RoleCode.SECRETARIA, RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
  @Audit('MINUTES_SIGNED')
  @ApiOperation({
    summary: 'Firma electrónica del acta por parte de Presidente o Secretario',
  })
  async signMinutes(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: Request & { user: JwtPayload },
  ) {
    // Determinamos el rol principal del usuario firmante
    const isPresident = req.user.roles?.includes(RoleCode.PRESIDENTE);
    const isSecretary = req.user.roles?.includes(RoleCode.SECRETARIA);

    let roleCode = RoleCode.EVALUADOR;
    if (isPresident) roleCode = RoleCode.PRESIDENTE;
    else if (isSecretary) roleCode = RoleCode.SECRETARIA;

    return this.callsService.signMinutes(id, req.user.id, roleCode);
  }
}
