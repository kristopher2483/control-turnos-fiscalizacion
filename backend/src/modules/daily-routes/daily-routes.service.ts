import { v4 as uuid } from 'uuid';
import { DataStore } from '../../storage/storage.interface';
import { AuthenticatedUser, DailyRouteAssignment } from '../../types';
import { CatalogService } from '../catalog/catalog.service';
import { conflict, forbidden, notFound } from '../../utils/http-error';
import { AdminListQuery, TakeRoutePointInput, UpdateAssignmentInput } from './daily-routes.schemas';

const REGISTROS_ROOT = 'registros';

interface LocatedAssignment {
  assignment: DailyRouteAssignment;
  fecha: string;
}

export class DailyRoutesService {
  constructor(private readonly store: DataStore, private readonly catalogService: CatalogService) {}

  private pathFor(fecha: string, inspectorId: string): string {
    return `${REGISTROS_ROOT}/${fecha}/${inspectorId}`;
  }

  async listMine(inspectorId: string, fecha: string): Promise<DailyRouteAssignment[]> {
    return this.store.readJson<DailyRouteAssignment[]>(this.pathFor(fecha, inspectorId), []);
  }

  async take(input: TakeRoutePointInput, user: AuthenticatedUser): Promise<DailyRouteAssignment> {
    const points = await this.catalogService.listByFecha(input.fecha);
    const routePoint = points.find((point) => point.id === input.routePointId);
    if (!routePoint) {
      throw notFound('El punto de ruta no existe para la fecha indicada');
    }
    if (routePoint.estadoDisponibilidad !== 'disponible') {
      throw conflict('Este punto de ruta ya fue tomado por otro inspector');
    }
    if (routePoint.assignedInspectorId && routePoint.assignedInspectorId !== user.id) {
      throw forbidden('Este punto fue asignado por el administrador a otro inspector');
    }

    await this.catalogService.markAsTomado(routePoint.id);

    const now = new Date().toISOString();
    const assignment: DailyRouteAssignment = {
      id: uuid(),
      routePointId: routePoint.id,
      inspectorId: user.id,
      inspectorUsername: user.username,
      fecha: input.fecha,
      snapshot: {
        sector: routePoint.sector,
        direccion: routePoint.direccion,
        empresaResponsable: routePoint.empresaResponsable,
        tipoExigencia: routePoint.tipoExigencia,
        descripcionExigencia: routePoint.descripcionExigencia,
        ventanaEntrada: routePoint.ventanaEntrada,
        ventanaSalida: routePoint.ventanaSalida
      },
      estado: 'pendiente',
      observaciones: '',
      fiscalizaciones: [],
      createdAt: now,
      updatedAt: now,
      updatedBy: user.id
    };

    const list = await this.listMine(user.id, input.fecha);
    list.push(assignment);
    await this.store.writeJson(this.pathFor(input.fecha, user.id), list);

    return assignment;
  }

  private async findOwnedById(id: string, inspectorId: string): Promise<LocatedAssignment | undefined> {
    const fechas = await this.store.listChildren(REGISTROS_ROOT);
    for (const fecha of fechas) {
      const list = await this.listMine(inspectorId, fecha);
      const assignment = list.find((candidate) => candidate.id === id);
      if (assignment) {
        return { assignment, fecha };
      }
    }
    return undefined;
  }

  async update(id: string, user: AuthenticatedUser, input: UpdateAssignmentInput): Promise<DailyRouteAssignment> {
    const located = await this.findOwnedById(id, user.id);
    if (!located) {
      const existsElsewhere = await this.findAcrossAllInspectors(id);
      if (existsElsewhere) {
        throw forbidden('No puede modificar un registro que no le pertenece');
      }
      throw notFound('Registro de ruta diaria no encontrado');
    }
    if (located.assignment.estado === 'liberado') {
      throw conflict('Esta ruta ya fue liberada y no puede editarse. Debe volver a tomarla para continuar.');
    }
    if (located.assignment.estado === 'fiscalizado') {
      throw conflict('Esta ruta ya fue fiscalizada y no puede editarse.');
    }

    const { nuevaFiscalizacion, ...fields } = input;
    const updated: DailyRouteAssignment = {
      ...located.assignment,
      ...fields,
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    if (nuevaFiscalizacion) {
      const nextNumero = located.assignment.fiscalizaciones.length + 1;
      updated.fiscalizaciones = [
        ...located.assignment.fiscalizaciones,
        {
          numero: nextNumero,
          horaRegistro: new Date().toISOString(),
          comentario: nuevaFiscalizacion.comentario
        }
      ];
    }

    const list = await this.listMine(user.id, located.fecha);
    const index = list.findIndex((candidate) => candidate.id === id);
    list[index] = updated;
    await this.store.writeJson(this.pathFor(located.fecha, user.id), list);

    return updated;
  }

  async release(id: string, user: AuthenticatedUser): Promise<DailyRouteAssignment> {
    const located = await this.findOwnedById(id, user.id);
    if (!located) {
      const existsElsewhere = await this.findAcrossAllInspectors(id);
      if (existsElsewhere) {
        throw forbidden('No puede liberar un registro que no le pertenece');
      }
      throw notFound('Registro de ruta diaria no encontrado');
    }
    if (located.assignment.estado === 'liberado') {
      throw conflict('Esta ruta ya fue liberada');
    }
    if (located.assignment.estado === 'fiscalizado' || located.assignment.estado === 'no_corresponde') {
      throw conflict('No se puede liberar una ruta que ya fue cerrada (fiscalizada o marcada como no corresponde)');
    }

    const updated: DailyRouteAssignment = {
      ...located.assignment,
      estado: 'liberado',
      updatedAt: new Date().toISOString(),
      updatedBy: user.id
    };

    const list = await this.listMine(user.id, located.fecha);
    const index = list.findIndex((candidate) => candidate.id === id);
    list[index] = updated;
    await this.store.writeJson(this.pathFor(located.fecha, user.id), list);

    await this.catalogService.markAsDisponible(updated.routePointId);

    return updated;
  }

  private async findAcrossAllInspectors(id: string): Promise<boolean> {
    const fechas = await this.store.listChildren(REGISTROS_ROOT);
    for (const fecha of fechas) {
      const inspectorIds = await this.store.listChildren(`${REGISTROS_ROOT}/${fecha}`);
      for (const inspectorId of inspectorIds) {
        const list = await this.listMine(inspectorId, fecha);
        if (list.some((candidate) => candidate.id === id)) {
          return true;
        }
      }
    }
    return false;
  }

  async listAll(filters: AdminListQuery): Promise<DailyRouteAssignment[]> {
    const fechas = filters.fecha ? [filters.fecha] : await this.store.listChildren(REGISTROS_ROOT);
    const results: DailyRouteAssignment[] = [];

    for (const fecha of fechas) {
      const inspectorIds = filters.inspectorId
        ? [filters.inspectorId]
        : await this.store.listChildren(`${REGISTROS_ROOT}/${fecha}`);

      for (const inspectorId of inspectorIds) {
        const list = await this.listMine(inspectorId, fecha);
        results.push(...list);
      }
    }

    return results;
  }
}
