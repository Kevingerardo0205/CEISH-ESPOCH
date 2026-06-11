import { Injectable } from '@nestjs/common';
import {
  Document,
  Packer,
  Paragraph,
  Table,
  TableRow,
  TableCell,
  TextRun,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
} from 'docx';

export interface Annex9ChecklistItem {
  label: string;
  c: boolean;
  nc: boolean;
  na: boolean;
  observaciones?: string;
}

export interface GenerateAnnex9DocxData {
  ceishCode: string;
  protocolTitle: string;
  investigatorName: string;
  evaluationDate: Date;
  studyType: string;
  ethicalItems: Annex9ChecklistItem[];
  methodologicalItems: Annex9ChecklistItem[];
  legalItems: Annex9ChecklistItem[];
  ethicalResult: string;
  ethicalPlazo?: string;
  methodologicalResult: string;
  methodologicalPlazo?: string;
  legalResult: string;
  legalPlazo?: string;
  revisorName?: string;
}

// ─── Helpers de color y estilos ────────────────────────────────────────────────
const COLOR_BLUE_DARK = '1e3a8a';
const COLOR_RED = 'b91c1c';
const COLOR_GRAY = '475569';
const COLOR_HEADER_BG = 'dbeafe'; // azul muy claro para cabeceras
const COLOR_MARK = '16a34a'; // verde para la X de cumple
const COLOR_NC = 'd97706'; // naranja para NC
const COLOR_NA = '64748b'; // gris para NA
const FONT = 'Calibri';

/** Celda simple con texto y opciones de estilo */
function cell(
  text: string,
  opts: {
    bold?: boolean;
    color?: string;
    fontSize?: number;
    bg?: string;
    center?: boolean;
    width?: number;
    vAlign?: 'top' | 'center' | 'bottom';
    borders?: boolean;
  } = {},
): TableCell {
  const {
    bold = false,
    color = '000000',
    fontSize = 18,
    bg,
    center = false,
    width,
    vAlign = 'center' as const,
    borders = true,
  } = opts;

  const noBorder = {
    top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
    right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
  };

  const thinBorder = {
    top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
    right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
  };

  return new TableCell({
    verticalAlign: vAlign,
    shading: bg ? { type: ShadingType.CLEAR, fill: bg } : undefined,
    borders: borders ? thinBorder : noBorder,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    children: [
      new Paragraph({
        alignment: center ? AlignmentType.CENTER : AlignmentType.LEFT,
        spacing: { before: 40, after: 40 },
        children: [
          new TextRun({
            text,
            bold,
            color,
            size: fontSize,
            font: FONT,
          }),
        ],
      }),
    ],
  });
}

/** Fila de cabecera para las tablas de checklist */
function checklistHeaderRow(): TableRow {
  return new TableRow({
    tableHeader: true,
    children: [
      cell('Criterio de Evaluación', {
        bold: true,
        bg: COLOR_HEADER_BG,
        color: COLOR_BLUE_DARK,
        fontSize: 17,
        width: 5400,
      }),
      cell('C', {
        bold: true,
        bg: COLOR_HEADER_BG,
        color: COLOR_BLUE_DARK,
        center: true,
        fontSize: 17,
        width: 700,
      }),
      cell('NC', {
        bold: true,
        bg: COLOR_HEADER_BG,
        color: COLOR_BLUE_DARK,
        center: true,
        fontSize: 17,
        width: 700,
      }),
      cell('NA', {
        bold: true,
        bg: COLOR_HEADER_BG,
        color: COLOR_BLUE_DARK,
        center: true,
        fontSize: 17,
        width: 700,
      }),
      cell('Observaciones', {
        bold: true,
        bg: COLOR_HEADER_BG,
        color: COLOR_BLUE_DARK,
        fontSize: 17,
        width: 2500,
      }),
    ],
  });
}

/** Una fila de ítem del checklist */
function checklistItemRow(index: number, item: Annex9ChecklistItem): TableRow {
  const mark = (active: boolean, color: string) =>
    active
      ? new TextRun({ text: 'X', bold: true, color, font: FONT, size: 18 })
      : new TextRun({ text: '', font: FONT, size: 18 });

  const cellMark = (active: boolean, color: string) =>
    new TableCell({
      verticalAlign: 'center',
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        left: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
        right: { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' },
      },
      width: { size: 700, type: WidthType.DXA },
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 40, after: 40 },
          children: [mark(active, color)],
        }),
      ],
    });

  return new TableRow({
    children: [
      cell(`${index}. ${item.label}`, { fontSize: 17, width: 5400 }),
      cellMark(item.c, COLOR_MARK),
      cellMark(item.nc, COLOR_NC),
      cellMark(item.na, COLOR_NA),
      cell(item.observaciones ?? '', {
        fontSize: 16,
        color: COLOR_GRAY,
        width: 2500,
      }),
    ],
  });
}

/** Tabla de checklist completa (cabecera + ítems + leyenda) */
function buildChecklistTable(items: Annex9ChecklistItem[]): Table {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      checklistHeaderRow(),
      ...items.map((it, i) => checklistItemRow(i + 1, it)),
    ],
  });
}

/** Párrafo de leyenda C/NC/NA */
function legendParagraph(): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 120 },
    children: [
      new TextRun({
        text: 'C: Cumple  |  NC: No Cumple  |  NA: No Aplica',
        italics: true,
        color: COLOR_GRAY,
        font: FONT,
        size: 16,
      }),
    ],
  });
}

/** Sección de resultado de un criterio */
function resultSection(
  criterio: string,
  resultado: string,
  plazo?: string,
): Paragraph[] {
  const isAprobado = resultado === 'APROBADO';
  const isNoAprobado = resultado === 'NO_APROBADO';
  const isConObs = resultado === 'CON_OBSERVACIONES';

  const check = (active: boolean) =>
    new TextRun({
      text: active ? '[X]' : '[  ]',
      bold: active,
      color: active ? COLOR_BLUE_DARK : COLOR_GRAY,
      font: FONT,
      size: 18,
    });

  return [
    new Paragraph({
      spacing: { before: 160, after: 40 },
      children: [
        new TextRun({
          text: `RESULTADO DE LA EVALUACIÓN ${criterio.toUpperCase()}`,
          bold: true,
          color: COLOR_BLUE_DARK,
          font: FONT,
          size: 20,
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 40 },
      children: [
        check(isAprobado),
        new TextRun({ text: '  Aprobado     ', font: FONT, size: 18 }),
        check(isNoAprobado),
        new TextRun({ text: '  No aprobado     ', font: FONT, size: 18 }),
        check(isConObs),
        new TextRun({ text: '  Con observaciones', font: FONT, size: 18 }),
      ],
    }),
    new Paragraph({
      spacing: { before: 40, after: 80 },
      children: [
        new TextRun({
          text: `Plazo para absolver las observaciones: ${plazo ?? (isConObs ? '30 días hábiles' : 'N/A')}`,
          font: FONT,
          size: 18,
          color: COLOR_GRAY,
        }),
      ],
    }),
  ];
}

/** Sección de título de bloque (II. EVALUACIÓN ÉTICA, etc.) */
function sectionTitle(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 240, after: 100 },
    children: [
      new TextRun({
        text,
        bold: true,
        color: COLOR_BLUE_DARK,
        font: FONT,
        size: 22,
        underline: {},
      }),
    ],
  });
}

@Injectable()
export class DocxGeneratorService {
  /**
   * Genera el documento Word oficial del Anexo 9 (Guía de Evaluación Expedita)
   * replicando el formato del template CEISH-ESPOCH.
   */
  async generateAnnex9Docx(data: GenerateAnnex9DocxData): Promise<Buffer> {
    const formattedDate = data.evaluationDate.toLocaleDateString('es-EC', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    // ── Tabla de Datos Generales ─────────────────────────────────────────────
    const datosGeneralesTable = new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            cell('Título de la investigación:', {
              bold: true,
              bg: COLOR_HEADER_BG,
              color: COLOR_BLUE_DARK,
              fontSize: 18,
              width: 2800,
            }),
            cell(data.protocolTitle, { fontSize: 18, width: 7200 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Código de la investigación:', {
              bold: true,
              bg: COLOR_HEADER_BG,
              color: COLOR_BLUE_DARK,
              fontSize: 18,
              width: 2800,
            }),
            cell(data.ceishCode, {
              bold: true,
              color: COLOR_RED,
              fontSize: 18,
              width: 7200,
            }),
          ],
        }),
        new TableRow({
          children: [
            cell('Investigador/es:', {
              bold: true,
              bg: COLOR_HEADER_BG,
              color: COLOR_BLUE_DARK,
              fontSize: 18,
              width: 2800,
            }),
            cell(data.investigatorName, { fontSize: 18, width: 7200 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Tipo de estudio:', {
              bold: true,
              bg: COLOR_HEADER_BG,
              color: COLOR_BLUE_DARK,
              fontSize: 18,
              width: 2800,
            }),
            cell(data.studyType, { fontSize: 18, width: 7200 }),
          ],
        }),
        new TableRow({
          children: [
            cell('Fecha de evaluación:', {
              bold: true,
              bg: COLOR_HEADER_BG,
              color: COLOR_BLUE_DARK,
              fontSize: 18,
              width: 2800,
            }),
            cell(formattedDate, { fontSize: 18, width: 7200 }),
          ],
        }),
      ],
    });

    // ── Documento ────────────────────────────────────────────────────────────
    const doc = new Document({
      creator: 'CEISH-ESPOCH Sistema',
      title: `Anexo 9 - ${data.ceishCode}`,
      description:
        'Guía de Evaluación Expedita de Estudios Observacionales y de Intervención en Seres Humanos',
      sections: [
        {
          properties: {},
          children: [
            // Título principal
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 60 },
              children: [
                new TextRun({
                  text: 'ANEXO 9',
                  bold: true,
                  color: COLOR_RED,
                  font: FONT,
                  size: 28,
                }),
              ],
            }),
            new Paragraph({
              alignment: AlignmentType.CENTER,
              spacing: { before: 0, after: 200 },
              children: [
                new TextRun({
                  text: 'GUÍA PARA EVALUACIÓN EXPEDITA DE ESTUDIOS OBSERVACIONALES Y DE INTERVENCIÓN EN SERES HUMANOS CEISH-ESPOCH',
                  bold: true,
                  color: COLOR_BLUE_DARK,
                  font: FONT,
                  size: 22,
                }),
              ],
            }),

            // I. Datos Generales
            sectionTitle('I. DATOS GENERALES'),
            datosGeneralesTable,

            // II. Evaluación Ética
            sectionTitle('II. EVALUACIÓN ÉTICA'),
            buildChecklistTable(data.ethicalItems),
            legendParagraph(),
            ...resultSection('Ética', data.ethicalResult, data.ethicalPlazo),

            // III. Evaluación Metodológica
            sectionTitle('III. EVALUACIÓN METODOLÓGICA'),
            buildChecklistTable(data.methodologicalItems),
            legendParagraph(),
            ...resultSection(
              'Metodológica',
              data.methodologicalResult,
              data.methodologicalPlazo,
            ),

            // IV. Evaluación Jurídica
            sectionTitle('IV. EVALUACIÓN JURÍDICA'),
            buildChecklistTable(data.legalItems),
            legendParagraph(),
            ...resultSection('Jurídica', data.legalResult, data.legalPlazo),

            // Revisores
            new Paragraph({
              spacing: { before: 320, after: 60 },
              children: [
                new TextRun({
                  text: 'Revisores asignados:',
                  bold: true,
                  color: COLOR_BLUE_DARK,
                  font: FONT,
                  size: 20,
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: data.revisorName ?? 'REVISOR ASIGNADO',
                  bold: true,
                  font: FONT,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 200, after: 40 },
              children: [
                new TextRun({
                  text: '_______________________________',
                  color: COLOR_GRAY,
                  font: FONT,
                  size: 18,
                }),
              ],
            }),
            new Paragraph({
              spacing: { before: 40, after: 0 },
              children: [
                new TextRun({
                  text: 'Firma del Evaluador CEISH-ESPOCH',
                  color: COLOR_GRAY,
                  italics: true,
                  font: FONT,
                  size: 17,
                }),
              ],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    return buffer;
  }
}
