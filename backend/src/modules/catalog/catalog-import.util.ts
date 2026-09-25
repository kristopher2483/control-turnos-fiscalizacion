import * as XLSX from 'xlsx';

/** Canonical field names this importer fills in, matching CreateRoutePointInput plus the raw inspector reference. */
export type ImportedRowFields = {
  fecha?: string;
  diaProgramado?: string;
  sector?: string;
  direccion?: string;
  empresaResponsable?: string;
  tipoExigencia?: string;
  descripcionExigencia?: string;
  ventanaEntrada?: string;
  ventanaSalida?: string;
  vigenciaDesde?: string;
  vigenciaHasta?: string;
  inspectorAsignado?: string;
};

// Maps a normalized (accent-stripped, lowercased, no-spaces) header to the canonical field it fills.
// Several aliases per field so common variations in how an admin might type the column headers still work.
const HEADER_ALIASES: Record<string, keyof ImportedRowFields> = {
  fecha: 'fecha',
  diaprogramado: 'diaProgramado',
  dia: 'diaProgramado',
  sector: 'sector',
  direccion: 'direccion',
  empresaresponsable: 'empresaResponsable',
  empresa: 'empresaResponsable',
  tipoexigencia: 'tipoExigencia',
  exigencia: 'tipoExigencia',
  descripcionexigencia: 'descripcionExigencia',
  descripcion: 'descripcionExigencia',
  ventanaentrada: 'ventanaEntrada',
  horaentrada: 'ventanaEntrada',
  entrada: 'ventanaEntrada',
  ventanasalida: 'ventanaSalida',
  horasalida: 'ventanaSalida',
  salida: 'ventanaSalida',
  vigenciadesde: 'vigenciaDesde',
  vigenciahasta: 'vigenciaHasta',
  inspectorasignado: 'inspectorAsignado',
  inspector: 'inspectorAsignado'
};

const DATE_FIELDS: ReadonlySet<keyof ImportedRowFields> = new Set(['fecha', 'vigenciaDesde', 'vigenciaHasta']);
const TIME_FIELDS: ReadonlySet<keyof ImportedRowFields> = new Set(['ventanaEntrada', 'ventanaSalida']);

function normalizeHeader(header: string): string {
  return header
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '');
}

function pad2(value: number): string {
  return String(value).padStart(2, '0');
}

function normalizeDateCell(value: unknown): string {
  if (value instanceof Date) {
    return `${value.getFullYear()}-${pad2(value.getMonth() + 1)}-${pad2(value.getDate())}`;
  }
  if (typeof value === 'number') {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${pad2(parsed.m)}-${pad2(parsed.d)}`;
    }
  }
  return String(value ?? '').trim();
}

function normalizeTimeCell(value: unknown): string {
  if (value instanceof Date) {
    return `${pad2(value.getHours())}:${pad2(value.getMinutes())}`;
  }
  if (typeof value === 'number') {
    const totalMinutes = Math.round(value * 24 * 60);
    return `${pad2(Math.floor(totalMinutes / 60) % 24)}:${pad2(totalMinutes % 60)}`;
  }
  return String(value ?? '').trim();
}

/** Parses a CSV/XLSX file buffer into raw header→cell-value rows, one object per spreadsheet row. */
export function parseWorkbookRows(buffer: Buffer): Record<string, unknown>[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  } catch {
    throw new Error('No se pudo leer el archivo. Verifica que sea un CSV o XLSX válido.');
  }
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return [];
  }
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName], { defval: '' });
}

/** Maps one raw spreadsheet row (arbitrary header spelling) to our canonical field names, normalizing dates/times. */
export function mapRowToFields(rawRow: Record<string, unknown>): ImportedRowFields {
  const mapped: ImportedRowFields = {};
  for (const [header, value] of Object.entries(rawRow)) {
    const field = HEADER_ALIASES[normalizeHeader(header)];
    if (!field) continue;
    if (DATE_FIELDS.has(field)) {
      mapped[field] = normalizeDateCell(value);
    } else if (TIME_FIELDS.has(field)) {
      mapped[field] = normalizeTimeCell(value);
    } else {
      mapped[field] = String(value ?? '').trim();
    }
  }
  return mapped;
}

export function isRowBlank(fields: ImportedRowFields): boolean {
  return Object.values(fields).every((value) => !value || value.trim() === '');
}
