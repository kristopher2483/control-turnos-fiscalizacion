import { supabase } from '../../db/supabase';
import { DailyRouteAssignment } from '../../types';
import { DailyRouteAssignmentRow, toAssignment } from '../daily-routes/daily-routes.mapper';
import { SummaryQuery } from './reports.schemas';

export interface SummaryReport {
  totalPuntos: number;
  porEstado: Record<string, number>;
  porSector: Record<string, number>;
  porInspector: Record<string, { total: number; completados: number }>;
}

export class ReportsService {
  private async listAssignmentsInRange(desde: string, hasta: string): Promise<DailyRouteAssignment[]> {
    const { data, error } = await supabase
      .from('daily_route_assignments')
      .select('*')
      .gte('fecha', desde)
      .lte('fecha', hasta);
    if (error) throw error;
    return ((data ?? []) as DailyRouteAssignmentRow[]).map(toAssignment);
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

  async exportCsv(desde: string, hasta: string): Promise<string> {
    const assignments = await this.listAssignmentsInRange(desde, hasta);

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
