import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';

@Injectable()
export class PdfGeneratorService {
  private pdfmake: any;

  constructor() {
    this.pdfmake = require('pdfmake');
    const fonts = {
      Helvetica: {
        normal: 'Helvetica',
        bold: 'Helvetica-Bold',
        italics: 'Helvetica-Oblique',
        bolditalics: 'Helvetica-BoldOblique',
      },
    };
    this.pdfmake.setFonts(fonts);
  }

  async generateReceptionCertificate(data: {
    ceishCode: string;
    investigatorName: string;
    protocolTitle: string;
    date: Date;
    studyType: string;
  }): Promise<Buffer> {
    const docDefinition: TDocumentDefinitions = {
      content: [
        {
          text: 'COMITÉ DE ÉTICA DE INVESTIGACIÓN EN SERES HUMANOS',
          style: 'header',
          alignment: 'center',
        },
        {
          text: 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO (ESPOCH)',
          style: 'subheader',
          alignment: 'center',
        },
        { text: '\n\n' },
        {
          text: 'CONSTANCIA DE RECEPCIÓN DE PROTOCOLO',
          style: 'title',
          alignment: 'center',
        },
        { text: '\n\n' },
        {
          text: [
            { text: 'Código de Trámite: ', bold: true },
            { text: data.ceishCode },
            '\n',
            { text: 'Fecha de Recepción: ', bold: true },
            { text: data.date.toLocaleDateString() },
          ],
          margin: [0, 10, 0, 10],
        },
        { text: '\n' },
        {
          text: 'Por la presente, el CEISH-ESPOCH deja constancia de haber recibido la documentación completa del siguiente estudio:',
          margin: [0, 10, 0, 10],
        },
        {
          table: {
            widths: ['30%', '70%'],
            body: [
              [{ text: 'Título del Proyecto', bold: true }, data.protocolTitle],
              [
                { text: 'Investigador Principal', bold: true },
                data.investigatorName,
              ],
              [{ text: 'Tipo de Estudio', bold: true }, data.studyType],
            ],
          },
        },
        { text: '\n\n' },
        {
          text: 'Este documento acredita únicamente la recepción documental. El protocolo entrará ahora en la fase de evaluación ética, metodológica y jurídica conforme al Plan de Ejecución Táctica (PET).',
          italics: true,
        },
        { text: '\n\n\n\n' },
        {
          columns: [
            {
              stack: [
                { text: '__________________________', alignment: 'center' },
                {
                  text: 'Secretaría CEISH-ESPOCH',
                  alignment: 'center',
                  bold: true,
                },
              ],
            },
          ],
        },
      ],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 11,
      },
      styles: {
        header: { fontSize: 14, bold: true },
        subheader: { fontSize: 12, bold: true },
        title: { fontSize: 13, bold: true, decoration: 'underline' },
      },
    };

    const pdfDoc = this.pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }
}
