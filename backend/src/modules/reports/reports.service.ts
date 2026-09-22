import { DataStore } from '../../storage/storage.interface';
import { DailyRouteAssignment } from '../../types';
import { SummaryQuery } from './reports.schemas';

const REGISTROS_ROOT = 'registros';

export interface SummaryReport {
  totalPuntos: number;
  porEstado: Record<string, number>;
  porSector: Record<string, number>;
  porInspector: Record<string, { total: number; completados: number }>;
}

export class ReportsService {
  constructor(private readonly store: DataStore) {}

  private async listAssignmentsForFecha(fecha: string): Promise<DailyRouteAssignment[]> {
    const inspectorIds = await this.store.listChildren(`${REGISTROS_ROOT}/${fecha}`);
    const results: DailyRouteAssignment[] = [];
    for (const inspectorId of inspectorIds) {
      const list = await this.store.readJson<DailyRouteAssignment[]>(
        `${REGISTROS_ROOT}/${fecha}/${inspectorId}`,
        []
      );
      results.push(...list);
    }
    return results;
  }

  private async listAssignmentsInRange(desde: string, hasta: string): Promise<DailyRouteAssignment[]> {
    const allFechas = await this.store.listChildren(REGISTROS_ROOT);
    const fechasInRange = allFechas.filter((fecha) => fecha >= desde && fecha <= hasta);
    const results: DailyRouteAssignment[] = [];
    for (const fecha of fechasInRange) {
      results.push(...(await this.listAssignmentsForFecha(fecha)));
    }
    return results;
  }

  async summary(query: SummaryQuery): Promise<SummaryReport> {
    const assignments = await this.listAssignmentsInRange(query.desde, query.hasta);

    const porEstado: Record<string, number> = {};
    const porSector: Record<string, number> = {};
    const porInspector: Record<string, { total: number; completados: number }> = {};

    for (const assignment of assignments) {
      porEstado[assignment.estado] = (porEstado[assignment.estado] ?? 0) + 1;
      porSector[assignment.snapshot.sector] = (porSector[assignment.snapshot.sector] ?? 0) + 1;

      const inspectorKey = assignment.inspectorUsername;
      if (!porInspector[inspectorKey]) {
        porInspector[inspectorKey] = { total: 0, completados: 0 };
      }
      porInspector[inspectorKey].total += 1;
      if (assignment.estado === 'fiscalizado') {
        porInspector[inspectorKey].completados += 1;
      }
    }

    return {
      totalPuntos: assignments.length,
      porEstado,
      porSector,
      porInspector
    };
  }

  async exportCsv(fecha: string): Promise<string> {
    const assignments = await this.listAssignmentsForFecha(fecha);

    const header = [
      'inspector',
      'sector',
      'direccion',
      'empresa',
      'tipoExigencia',
      'estado',
      'observaciones',
      'horaLlegada',
      'horaSalida',
      'cantidadFiscalizaciones'
    ];

    const rows = assignments.map((assignment) =>
      [
        assignment.inspectorUsername,
        assignment.snapshot.sector,
        assignment.snapshot.direccion,
        assignment.snapshot.empresaResponsable,
        assignment.snapshot.tipoExigencia,
        assignment.estado,
        assignment.observaciones,
        assignment.horaLlegada ?? '',
        assignment.horaSalida ?? '',
        String(assignment.fiscalizaciones.length)
      ].map(this.escapeCsvValue)
    );

    return [header.join(','), ...rows.map((row) => row.join(','))].join('\n');
  }

  private escapeCsvValue(value: string): string {
    if (/[",\n]/.test(value)) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}
