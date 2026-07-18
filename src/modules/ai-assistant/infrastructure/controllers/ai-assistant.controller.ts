import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { ChatRequestDto } from '../../application/dtos/chat-request.dto';
import { GeminiService } from '../../application/services/gemini.service';
import { RagService } from '../../application/services/rag.service';
import { ContextService } from '../../application/services/context.service';

@Controller('ai-assistant')
@UseGuards(JwtAuthGuard)
export class AiAssistantController {
  constructor(
    private readonly geminiService: GeminiService,
    private readonly ragService: RagService,
    private readonly contextService: ContextService,
  ) {}

  @Post('chat')
  async chat(@Body() body: ChatRequestDto, @Req() req: any) {
    const { message, protocolId, history } = body;
    const user = req.user;

    // 1. Validar dinámicamente los roles permitidos en base de datos
    const allowedRoles = await this.ragService.getAllowedRoles();
    const hasAccess = allowedRoles.some((role) =>
      user.roles?.some((userRole: any) => {
        const roleName =
          typeof userRole === 'string' ? userRole : userRole.name;
        return roleName?.toUpperCase() === role.toUpperCase();
      }),
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'No tiene permisos para utilizar el asistente de IA.',
      );
    }

    // 2. Obtener fragmentos relevantes de la normativa PET
    const matchedRegulations = this.ragService.retrieve(message);
    const ragContext = matchedRegulations.join('\n\n---\n\n');

    // 3. Obtener información de contexto del protocolo si se suministra su ID
    let protocolContext = '';
    if (protocolId) {
      protocolContext =
        await this.contextService.getProtocolContext(protocolId);
    }

    // 4. Generar respuesta usando Gemini
    const responseText = await this.geminiService.generateResponse(
      message,
      ragContext,
      protocolContext,
      history,
    );

    return { response: responseText };
  }

  @Get('allowed-roles')
  async getAllowedRoles() {
    const roles = await this.ragService.getAllowedRoles();
    return { allowedRoles: roles };
  }
}
