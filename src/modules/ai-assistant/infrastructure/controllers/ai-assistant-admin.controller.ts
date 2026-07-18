import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../../../../shared/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../shared/guards/roles.guard';
import { Roles } from '../../../../shared/decorators/roles.decorator';
import { RoleCode } from '../../../auth/domain/enums/role.enum';
import { RagService } from '../../application/services/rag.service';

@Controller('admin/ai-assistant')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleCode.PRESIDENTE, RoleCode.ADMIN_TI)
export class AiAssistantAdminController {
  constructor(private readonly ragService: RagService) {}

  @Get('config')
  async getConfig() {
    return await this.ragService.getConfigSummary();
  }

  @Post('upload-pet')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPet(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se ha suministrado ningún archivo.');
    }

    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException(
        'El archivo cargado debe ser un documento PDF.',
      );
    }

    try {
      // Parsear el archivo PDF a texto plano usando la clase PDFParse del paquete instalado
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { PDFParse } = require('pdf-parse');
      const parser = new PDFParse({ data: file.buffer });
      const textResult = await parser.getText();
      const extractedText = textResult.text;

      if (!extractedText || extractedText.trim().length === 0) {
        throw new BadRequestException(
          'No se pudo extraer texto del PDF suministrado. Asegúrese de que no sea una imagen escaneada sin OCR.',
        );
      }

      // Actualizar la normativa en la base de datos y memoria
      await this.ragService.reloadRegulations(extractedText, file.originalname);

      return {
        message:
          'Normativa PET actualizada y recargada correctamente en el asistente de IA.',
        petFileName: file.originalname,
        characterCount: extractedText.length,
      };
    } catch (err: any) {
      if (err instanceof BadRequestException) {
        throw err;
      }
      throw new BadRequestException(
        `Error al procesar el archivo PDF: ${err.message || err}`,
      );
    }
  }

  @Put('roles')
  @HttpCode(HttpStatus.OK)
  async updateRoles(@Body() body: { allowedRoles: string[] }) {
    const { allowedRoles } = body;
    if (!allowedRoles || !Array.isArray(allowedRoles)) {
      throw new BadRequestException(
        'El campo allowedRoles es obligatorio y debe ser un array de strings.',
      );
    }

    // Validar que los roles suministrados pertenezcan al enum de RoleCode
    const validRoles = Object.values(RoleCode);
    const invalidRoles = allowedRoles.filter(
      (role) => !validRoles.includes(role as RoleCode),
    );

    if (invalidRoles.length > 0) {
      throw new BadRequestException(
        `Los siguientes roles no son válidos: ${invalidRoles.join(', ')}`,
      );
    }

    await this.ragService.updateAllowedRoles(allowedRoles);

    return {
      message:
        'Permisos de roles actualizados correctamente para el asistente de IA.',
      allowedRoles,
    };
  }
}
