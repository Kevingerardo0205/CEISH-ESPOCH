import { Injectable } from '@nestjs/common';
import { TDocumentDefinitions } from 'pdfmake/interfaces';
import { PDF_LOGOS } from './pdf-logos';

declare const require: any;

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
    version?: number;
    checklist?: Array<{
      requirementName: string;
      status: string;
      pageCount: number;
    }>;
  }): Promise<Buffer> {
    const formattedDate = data.date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const formattedReceptionDate = data.date.toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    const versionNum = data.version || 1;
    const formattedVersion = String(versionNum).padStart(2, '0');

    const tableBody = [
      [
        { text: 'Requisitos', style: 'tableHeader' },
        { text: 'Si presento', style: 'tableHeaderCentred' },
        { text: 'No presento', style: 'tableHeaderCentred' },
        { text: 'Nro. De páginas', style: 'tableHeaderCentred' },
        { text: 'completo los documentos el', style: 'tableHeaderCentred' },
      ],
    ];

    if (data.checklist && data.checklist.length > 0) {
      data.checklist.forEach((item) => {
        const isPresentado =
          item.status === 'APROBADO' ||
          item.status === 'PRESENTADO' ||
          item.status === 'RECHAZADO';
        const isNoPresentado = !isPresentado;

        tableBody.push([
          { text: item.requirementName, style: 'tableValueText' },
          { text: isPresentado ? 'X' : '', style: 'tableValueCentred' },
          { text: isNoPresentado ? 'X' : '', style: 'tableValueCentred' },
          {
            text: isPresentado ? String(item.pageCount || 0) : '',
            style: 'tableValueCentred',
          },
          { text: '', style: 'tableValueCentred' },
        ]);
      });
    }

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 110, 40, 85],
      background: (_, pageSize) => {
        return {
          image: PDF_LOGOS.BACKGROUND,
          width: pageSize.width,
          height: pageSize.height,
        };
      },
      header: () => {
        return {
          stack: [
            {
              columns: [
                {
                  image: PDF_LOGOS.LOGO_HEADER_2,
                  width: 50,
                  margin: [40, 20, 0, 0],
                },
                {
                  stack: [
                    {
                      text: 'COMITÉ DE ÉTICA EN INVESTIGACIÓN EN SERES HUMANOS DE LA',
                      fontSize: 8,
                      bold: true,
                      color: '#1e3a8a',
                      alignment: 'center',
                    },
                    {
                      text: 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO (CEISH-ESPOCH)',
                      fontSize: 8.5,
                      bold: true,
                      color: '#475569',
                      alignment: 'center',
                      margin: [0, 2, 0, 0],
                    },
                  ],
                  margin: [0, 25, 0, 0],
                  width: '*',
                },
                {
                  image: PDF_LOGOS.LOGO_HEADER_1,
                  width: 45,
                  alignment: 'right',
                  margin: [0, 20, 40, 0],
                },
              ],
            },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 40,
                  y1: 10,
                  x2: 555,
                  y2: 10,
                  lineWidth: 1.5,
                  lineColor: '#b91c1c',
                },
              ],
            },
          ],
        };
      },
      footer: () => {
        return {
          stack: [
            {
              canvas: [
                {
                  type: 'line',
                  x1: 40,
                  y1: 0,
                  x2: 555,
                  y2: 0,
                  lineWidth: 1,
                  lineColor: '#cbd5e1',
                },
              ],
            },
            {
              columns: [
                {
                  text: 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO\nDirección: Panamericana Sur km 1 1/2, Teléfono: 03-2998200 Ext. 3035\nCorreo electrónico: inves.ceish@espoch.edu.ec\nFacultad de Salud Pública, modular de carrera de medicina, planta baja, frente a oficinas administrativas de la facultad.',
                  fontSize: 6.5,
                  color: '#64748b',
                  margin: [40, 8, 0, 0],
                  width: '65%',
                  lineHeight: 1.25,
                },
                {
                  columns: [
                    {
                      image: PDF_LOGOS.LOGO_FOOTER_1,
                      width: 25,
                      alignment: 'right',
                      margin: [0, 10, 5, 0],
                    },
                    {
                      image: PDF_LOGOS.LOGO_FOOTER_2,
                      width: 25,
                      alignment: 'right',
                      margin: [0, 10, 5, 0],
                    },
                    {
                      image: PDF_LOGOS.LOGO_FOOTER_3,
                      width: 25,
                      alignment: 'right',
                      margin: [0, 10, 40, 0],
                    },
                  ],
                  width: '35%',
                },
              ],
            },
          ],
        };
      },
      content: [
        {
          text: `Notificación de recepción de protocolo de investigación\n- estudios observacionales,`,
          style: 'docTitle',
          alignment: 'left',
          margin: [0, 5, 0, 15],
        },
        {
          text: `Riobamba, ${formattedDate}`,
          fontSize: 9.5,
          margin: [0, 0, 0, 15],
          alignment: 'left',
        },
        {
          text: data.investigatorName,
          fontSize: 9.5,
          bold: true,
          margin: [0, 0, 0, 15],
        },
        {
          text: [
            { text: 'Título del Protocolo: ', bold: true },
            { text: `“${data.protocolTitle}”. ` },
            { text: 'Protocolo Nro. ', bold: true },
            { text: `(${data.ceishCode})` },
            { text: 'Versión: ', bold: true },
            { text: `(Número ${formattedVersion})\n` },
            { text: 'Fecha de recepción: ', bold: true },
            { text: `${formattedReceptionDate}` },
          ],
          fontSize: 9.5,
          lineHeight: 1.3,
          margin: [0, 0, 0, 15],
        },
        {
          text: `Por medio de la presente se certifica que el protocolo de investigación “${data.protocolTitle}”. fue recibido por el Comité de Ética de Investigación en Seres Humanos de la Escuela Superior Politécnica de Chimborazo (CEISH-ESPOCH).`,
          fontSize: 9.5,
          alignment: 'justify',
          lineHeight: 1.3,
          margin: [0, 0, 0, 10],
        },
        {
          text: 'Se han recibido los siguientes documentos:',
          fontSize: 9.5,
          bold: true,
          margin: [0, 0, 0, 10],
        },
        {
          style: 'tableContainer',
          table: {
            headerRows: 1,
            widths: ['48%', '10%', '10%', '12%', '20%'],
            body: tableBody,
          },
          layout: {
            hLineWidth: (i, node) =>
              i === 0 || i === node.table.body.length ? 1.5 : 0.8,
            vLineWidth: (i, node) =>
              i === 0 ||
              i === (node.table.widths ? node.table.widths.length : 5)
                ? 1.5
                : 0.8,
            hLineColor: (i, node) =>
              i === 0 || i === node.table.body.length ? '#1e3a8a' : '#cbd5e1',
            vLineColor: (i, node) =>
              i === 0 ||
              i === (node.table.widths ? node.table.widths.length : 5)
                ? '#1e3a8a'
                : '#cbd5e1',
            paddingTop: () => 6,
            paddingBottom: () => 6,
            paddingLeft: () => 8,
            paddingRight: () => 8,
          },
        },
        { text: '\n' },
        {
          text: 'Usted recibirá una respuesta del CEISH – ESPOCH, al término de hasta 30 días hábiles. En caso de aceptar el término, se deberá enviar un correo electrónico a inves.ceish@espoch.edu.ec detallando la aceptación del inicio al proceso de evaluación. Una vez recibido su correo electrónico de aceptación, se empezará a contar los días del término establecido. En caso de no recibir su correo electrónico, el CEISH ESPOCH no realizará la evaluación del protocolo de investigación y se archivará el proceso.',
          style: 'noteText',
          margin: [0, 0, 0, 10],
        },
        {
          text: 'Cualquier pregunta, correspondencia y formas (por ejemplo, revisiones de la continuación, modificación, etc.)diríjase al correo electrónico de CEISH-ESPOCH: inves.ceish@espoch.edu.ec.',
          style: 'noteText',
          margin: [0, 0, 0, 10],
        },
        {
          text: 'Puede encontrar información adicional en el sitio web del CEISH-ESPOCH',
          style: 'noteText',
          margin: [0, 0, 0, 20],
        },
        {
          text: 'Atentamente,',
          fontSize: 9.5,
          margin: [0, 0, 0, 40],
        },
        {
          text: '--------------------------------------\nN.D. Verónica Delgado López\nPresidente/a CEISH-ESPOCH',
          fontSize: 9.5,
          bold: true,
          alignment: 'left',
          margin: [0, 0, 0, 0],
        },
      ],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 10,
        color: '#334155',
      },
      styles: {
        docTitle: {
          fontSize: 12,
          bold: true,
          color: '#1e3a8a',
        },
        bodyText: { fontSize: 9.5, lineHeight: 1.4, alignment: 'justify' },
        tableContainer: { margin: [0, 5, 0, 10] },
        tableHeader: {
          fontSize: 8.5,
          bold: true,
          color: '#0f172a',
          fillColor: '#f8fafc',
        },
        tableHeaderCentred: {
          fontSize: 8.5,
          bold: true,
          color: '#0f172a',
          fillColor: '#f8fafc',
          alignment: 'center',
        },
        tableValueText: { fontSize: 8.5, color: '#334155' },
        tableValueCentred: {
          fontSize: 8.5,
          color: '#334155',
          alignment: 'center',
        },
        tableValueCode: { fontSize: 9.5, bold: true, color: '#b91c1c' },
        noteText: {
          fontSize: 8.5,
          color: '#475569',
          lineHeight: 1.4,
          alignment: 'justify',
          bold: false,
        },
      },
    };

    const pdfDoc = this.pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }

  async generateAnnex9Report(data: {
    ceishCode: string;
    investigatorName: string;
    protocolTitle: string;
    date: Date;
    studyType: string;
    ethicalChecklist: Array<{
      text: string;
      c: boolean;
      nc: boolean;
      na: boolean;
      obs?: string;
    }>;
    methodologicalChecklist: Array<{
      text: string;
      c: boolean;
      nc: boolean;
      na: boolean;
      obs?: string;
    }>;
    legalChecklist: Array<{
      text: string;
      c: boolean;
      nc: boolean;
      na: boolean;
      obs?: string;
    }>;
    observations: string[];
    ethicalResult: string;
    ethicalPlazo?: string;
    methodologicalResult: string;
    methodologicalPlazo?: string;
    legalResult: string;
    legalPlazo?: string;
    revisores?: string[];
  }): Promise<Buffer> {
    const buildChecklistTable = (checklist: typeof data.ethicalChecklist) => {
      const rows = [
        [
          { text: 'Criterio de Evaluación', style: 'tableHeader' },
          { text: 'C', style: 'tableHeaderCentred' },
          { text: 'NC', style: 'tableHeaderCentred' },
          { text: 'NA', style: 'tableHeaderCentred' },
          { text: 'Observaciones', style: 'tableHeader' },
        ],
      ];

      checklist.forEach((item, index) => {
        rows.push([
          {
            text: `${index + 1}. ${item.text}`,
            style: 'tableValueText',
          },
          { text: item.c ? 'X' : '', style: 'tableValueCentred' },
          { text: item.nc ? 'X' : '', style: 'tableValueCentred' },
          { text: item.na ? 'X' : '', style: 'tableValueCentred' },
          { text: item.obs || '', style: 'tableValueTextSmall' },
        ]);
      });

      return {
        table: {
          widths: ['50%', '6%', '6%', '6%', '32%'],
          body: rows,
        },
        layout: {
          hLineWidth: (i, node) =>
            i === 0 || i === node.table.body.length ? 1.5 : 0.8,
          vLineWidth: (i, node) =>
            i === 0 || i === node.table.widths.length ? 1.5 : 0.8,
          hLineColor: (i, node) =>
            i === 0 || i === node.table.body.length ? '#1e3a8a' : '#e2e8f0',
          vLineColor: (i, node) =>
            i === 0 || i === node.table.widths.length ? '#1e3a8a' : '#e2e8f0',
          paddingTop: () => 6,
          paddingBottom: () => 6,
          paddingLeft: () => 6,
          paddingRight: () => 6,
        },
      };
    };

    const docDefinition: TDocumentDefinitions = {
      pageSize: 'A4',
      pageMargins: [40, 110, 40, 85],
      background: (_, pageSize) => {
        return {
          image: PDF_LOGOS.BACKGROUND,
          width: pageSize.width,
          height: pageSize.height,
        };
      },
      header: () => {
        return {
          stack: [
            {
              columns: [
                {
                  image: PDF_LOGOS.LOGO_HEADER_2,
                  width: 50,
                  margin: [40, 20, 0, 0],
                },
                {
                  stack: [
                    {
                      text: 'COMITÉ DE ÉTICA EN INVESTIGACIÓN EN SERES HUMANOS DE LA',
                      fontSize: 8,
                      bold: true,
                      color: '#1e3a8a',
                      alignment: 'center',
                    },
                    {
                      text: 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO (CEISH-ESPOCH)',
                      fontSize: 8.5,
                      bold: true,
                      color: '#475569',
                      alignment: 'center',
                      margin: [0, 2, 0, 0],
                    },
                  ],
                  margin: [0, 25, 0, 0],
                  width: '*',
                },
                {
                  image: PDF_LOGOS.LOGO_HEADER_1,
                  width: 45,
                  alignment: 'right',
                  margin: [0, 20, 40, 0],
                },
              ],
            },
            {
              canvas: [
                {
                  type: 'line',
                  x1: 40,
                  y1: 10,
                  x2: 555,
                  y2: 10,
                  lineWidth: 1.5,
                  lineColor: '#b91c1c',
                },
              ],
            },
          ],
        };
      },
      footer: () => {
        return {
          stack: [
            {
              canvas: [
                {
                  type: 'line',
                  x1: 40,
                  y1: 0,
                  x2: 555,
                  y2: 0,
                  lineWidth: 1,
                  lineColor: '#cbd5e1',
                },
              ],
            },
            {
              columns: [
                {
                  text: 'ESCUELA SUPERIOR POLITÉCNICA DE CHIMBORAZO\nDirección: Panamericana Sur km 1 1/2, Teléfono: 03-2998200 Ext. 3035\nCorreo electrónico: inves.ceish@espoch.edu.ec\nFacultad de Salud Pública, modular de Medicina, planta baja, frente a oficinas administrativas.',
                  fontSize: 6.5,
                  color: '#64748b',
                  margin: [40, 8, 0, 0],
                  width: '65%',
                  lineHeight: 1.25,
                },
                {
                  columns: [
                    {
                      image: PDF_LOGOS.LOGO_FOOTER_1,
                      width: 25,
                      alignment: 'right',
                      margin: [0, 10, 5, 0],
                    },
                    {
                      image: PDF_LOGOS.LOGO_FOOTER_2,
                      width: 25,
                      alignment: 'right',
                      margin: [0, 10, 5, 0],
                    },
                    {
                      image: PDF_LOGOS.LOGO_FOOTER_3,
                      width: 25,
                      alignment: 'right',
                      margin: [0, 10, 40, 0],
                    },
                  ],
                  width: '35%',
                },
              ],
            },
          ],
        };
      },
      content: [
        {
          text: 'ANEXO 9',
          fontSize: 11,
          bold: true,
          color: '#b91c1c',
          alignment: 'center',
          margin: [0, 0, 0, 2],
        },
        {
          text: 'GUÍA PARA EVALUACIÓN EXPEDITA DE ESTUDIOS OBSERVACIONALES\nY DE INTERVENCIÓN EN SERES HUMANOS CEISH-ESPOCH',
          style: 'docTitle',
          alignment: 'center',
          margin: [0, 0, 0, 15],
        },

        // DATOS GENERALES TABLE
        {
          text: 'I. DATOS GENERALES',
          fontSize: 10,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 5, 0, 5],
        },
        {
          style: 'tableContainer',
          table: {
            widths: ['30%', '70%'],
            body: [
              [
                { text: 'Título de la Investigación', style: 'tableHeader' },
                { text: data.protocolTitle, style: 'tableValueText' },
              ],
              [
                { text: 'Código de la Investigación', style: 'tableHeader' },
                { text: data.ceishCode, style: 'tableValueCode' },
              ],
              [
                { text: 'Investigador(es)', style: 'tableHeader' },
                { text: data.investigatorName, style: 'tableValueText' },
              ],
              [
                { text: 'Tipo de Estudio', style: 'tableHeader' },
                { text: data.studyType, style: 'tableValueText' },
              ],
              [
                { text: 'Fecha de Evaluación', style: 'tableHeader' },
                {
                  text: data.date.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  }),
                  style: 'tableValueText',
                },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1',
            paddingTop: () => 6,
            paddingBottom: () => 6,
            paddingLeft: () => 8,
            paddingRight: () => 8,
          },
        },

        // EVALUACIÓN ÉTICA
        {
          text: 'II. EVALUACIÓN ÉTICA',
          fontSize: 10,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 10, 0, 5],
          pageBreak: 'after', // Forzamos salto de página antes para la limpieza de tablas grandes si fuera necesario, o mejor después
        },
        buildChecklistTable(data.ethicalChecklist),
        {
          text: 'C: Cumple | NC: No Cumple | NA: No Aplica',
          fontSize: 8,
          italics: true,
          color: '#64748b',
          margin: [0, 3, 0, 15],
        },

        // EVALUACIÓN METODOLÓGICA
        {
          text: 'III. EVALUACIÓN METODOLÓGICA',
          fontSize: 10,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 10, 0, 5],
          pageBreak: 'before',
        },
        buildChecklistTable(data.methodologicalChecklist),
        {
          text: 'C: Cumple | NC: No Cumple | NA: No Aplica',
          fontSize: 8,
          italics: true,
          color: '#64748b',
          margin: [0, 3, 0, 15],
        },

        // EVALUACIÓN JURÍDICA
        {
          text: 'IV. EVALUACIÓN JURÍDICA',
          fontSize: 10,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 10, 0, 5],
          pageBreak: 'before',
        },
        buildChecklistTable(data.legalChecklist),
        {
          text: 'C: Cumple | NC: No Cumple | NA: No Aplica',
          fontSize: 8,
          italics: true,
          color: '#64748b',
          margin: [0, 3, 0, 15],
        },

        // OBSERVACIONES TEXTUALES
        {
          text: 'V. OBSERVACIONES DE LOS EVALUADORES',
          fontSize: 10,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 15, 0, 5],
          pageBreak: 'before',
        },
        data.observations && data.observations.length > 0
          ? {
              ul: data.observations.map((obs) => ({
                text: obs,
                style: 'bodyTextSmall',
              })),
              margin: [0, 5, 0, 15],
            }
          : {
              text: 'No se registran observaciones específicas.',
              style: 'noteText',
              margin: [0, 5, 0, 15],
            },

        // RESULTADOS GLOBALES
        {
          text: 'VI. RESULTADO GLOBAL DE LAS EVALUACIONES',
          fontSize: 10,
          bold: true,
          color: '#1e3a8a',
          margin: [0, 10, 0, 5],
        },
        {
          style: 'tableContainer',
          table: {
            widths: ['35%', '35%', '30%'],
            body: [
              [
                { text: 'Componente Evaluado', style: 'tableHeader' },
                { text: 'Dictamen Final', style: 'tableHeaderCentred' },
                { text: 'Plazo Absolución', style: 'tableHeaderCentred' },
              ],
              [
                { text: 'Evaluación Ética', style: 'tableValueTextBold' },
                {
                  text: data.ethicalResult,
                  style:
                    data.ethicalResult === 'APROBADO'
                      ? 'resultOk'
                      : 'resultWarn',
                  alignment: 'center',
                },
                {
                  text: data.ethicalPlazo || 'N/A',
                  style: 'tableValueCentred',
                },
              ],
              [
                {
                  text: 'Evaluación Metodológica',
                  style: 'tableValueTextBold',
                },
                {
                  text: data.methodologicalResult,
                  style:
                    data.methodologicalResult === 'APROBADO'
                      ? 'resultOk'
                      : 'resultWarn',
                  alignment: 'center',
                },
                {
                  text: data.methodologicalPlazo || 'N/A',
                  style: 'tableValueCentred',
                },
              ],
              [
                { text: 'Evaluación Jurídica', style: 'tableValueTextBold' },
                {
                  text: data.legalResult,
                  style:
                    data.legalResult === 'APROBADO' ? 'resultOk' : 'resultWarn',
                  alignment: 'center',
                },
                { text: data.legalPlazo || 'N/A', style: 'tableValueCentred' },
              ],
            ],
          },
          layout: {
            hLineWidth: () => 0.8,
            vLineWidth: () => 0.8,
            hLineColor: () => '#cbd5e1',
            vLineColor: () => '#cbd5e1',
            paddingTop: () => 8,
            paddingBottom: () => 8,
          },
        },

        { text: '\n\n' },

        // FIRMAS
        {
          columns: [
            {
              width: '*',
              stack: [
                {
                  text: '__________________________',
                  alignment: 'center',
                  color: '#cbd5e1',
                },
                {
                  text: 'Miembro Evaluador CEISH',
                  alignment: 'center',
                  bold: true,
                  fontSize: 9,
                  color: '#0f172a',
                  margin: [0, 4, 0, 0],
                },
                {
                  text:
                    data.revisores && data.revisores.length > 0
                      ? data.revisores.join(', ')
                      : 'Revisor Asignado',
                  alignment: 'center',
                  fontSize: 8,
                  color: '#64748b',
                },
              ],
            },
            {
              width: '*',
              stack: [
                {
                  text: '__________________________',
                  alignment: 'center',
                  color: '#cbd5e1',
                },
                {
                  text: 'Secretaría Técnica CEISH',
                  alignment: 'center',
                  bold: true,
                  fontSize: 9,
                  color: '#0f172a',
                  margin: [0, 4, 0, 0],
                },
                {
                  text: 'Validación de Dictamen',
                  alignment: 'center',
                  fontSize: 8,
                  color: '#64748b',
                },
              ],
            },
          ],
          margin: [0, 30, 0, 0],
        },
      ],
      defaultStyle: {
        font: 'Helvetica',
        fontSize: 9.5,
        color: '#334155',
      },
      styles: {
        docTitle: {
          fontSize: 11,
          bold: true,
          color: '#1e3a8a',
          lineHeight: 1.3,
        },
        bodyTextSmall: {
          fontSize: 8.5,
          lineHeight: 1.4,
          color: '#334155',
          alignment: 'justify',
        },
        tableContainer: { margin: [0, 5, 0, 10] },
        tableHeader: {
          fontSize: 8.5,
          bold: true,
          color: '#0f172a',
          fillColor: '#f8fafc',
        },
        tableHeaderCentred: {
          fontSize: 8.5,
          bold: true,
          color: '#0f172a',
          fillColor: '#f8fafc',
          alignment: 'center',
        },
        tableValueText: { fontSize: 8.5, color: '#334155' },
        tableValueTextBold: { fontSize: 8.5, bold: true, color: '#334155' },
        tableValueTextSmall: {
          fontSize: 8,
          color: '#475569',
          italics: true,
        },
        tableValueCentred: {
          fontSize: 8.5,
          color: '#334155',
          alignment: 'center',
        },
        tableValueCode: { fontSize: 8.5, bold: true, color: '#b91c1c' },
        resultOk: {
          fontSize: 8.5,
          bold: true,
          color: '#16a34a',
          fillColor: '#f0fdf4',
        },
        resultWarn: {
          fontSize: 8.5,
          bold: true,
          color: '#d97706',
          fillColor: '#fffbeb',
        },
        noteText: { fontSize: 8, color: '#64748b', italics: true },
      },
    };

    const pdfDoc = this.pdfmake.createPdf(docDefinition);
    return await pdfDoc.getBuffer();
  }
}
