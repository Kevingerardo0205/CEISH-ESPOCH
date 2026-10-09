import { Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { IMeetingPdfGeneratorPort } from '../../domain/ports/meeting-pdf-generator.port';
import { PdfGeneratorService } from '../../../../shared/utils/pdf-generator.service';
import { ConvocatoriaOrmEntity } from '../database/entities/convocatoria.orm-entity';
import { ConvocatoriaProtocoloOrmEntity } from '../database/entities/convocatoria-protocolo.orm-entity';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MeetingPdfGeneratorAdapter implements IMeetingPdfGeneratorPort {
  constructor(
    private readonly dataSource: DataSource,
    private readonly pdfGeneratorService: PdfGeneratorService,
  ) {}

  async generateAgendaPdf(meetingId: string): Promise<string> {
    const convocatoriaRepo = this.dataSource.getRepository(
      ConvocatoriaOrmEntity,
    );
    const meeting = await convocatoriaRepo.findOne({
      where: { id: meetingId },
      relations: ['lugar'],
    });

    if (!meeting) {
      throw new NotFoundException(
        `Convocatoria con ID ${meetingId} no encontrada para generar Orden del Día en PDF.`,
      );
    }

    const itemsRepo = this.dataSource.getRepository(
      ConvocatoriaProtocoloOrmEntity,
    );
    const agendaItems = await itemsRepo.find({
      where: { convocatoriaId: meetingId },
      relations: ['protocolo', 'protocolo.investigadorPrincipal', 'version'],
      order: { orden: 'ASC' },
    });

    const evaluationProtocols = agendaItems
      .filter(
        (item) => item.protocoloId !== null && item.protocoloId !== undefined,
      )
      .map((item) => ({
        ceishCode: item.protocolo?.ceishCode || `PROT-${item.protocoloId}`,
        title: item.protocolo?.title || 'Sin título',
        investigatorName: 'Investigador Principal',
      }));

    const meetingTime = meeting.fechaReunion
      ? new Date(meeting.fechaReunion).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '09:00';

    const placeName = meeting.lugar?.nombre || 'Sala de Sesiones CEISH-ESPOCH';

    const pdfBuffer = await this.pdfGeneratorService.generateCallPdf({
      code: meeting.numeroConvocatoria || '001-2026',
      date: meeting.fechaReunion || new Date(),
      time: meetingTime,
      placeName,
      sessionType: meeting.tipoSession,
      protocols: evaluationProtocols,
    });

    const uploadDir = path.resolve(process.cwd(), 'uploads', 'convocatorias');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `convocatoria-${meeting.numeroConvocatoria || meetingId}-orden-del-dia.pdf`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, pdfBuffer);

    const relativeUrl = `/api/evaluations/meetings/${meetingId}/pdf`;
    meeting.ordenDiaPdfPath = relativeUrl;
    await convocatoriaRepo.save(meeting);

    return relativeUrl;
  }
}
