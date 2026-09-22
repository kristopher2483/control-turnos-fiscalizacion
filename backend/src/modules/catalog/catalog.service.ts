import { v4 as uuid } from 'uuid';
import { DataStore } from '../../storage/storage.interface';
import { RoutePoint, RoutePointWithAssignee } from '../../types';
import { badRequest, conflict, notFound } from '../../utils/http-error';
import { UsersService } from '../users/users.service';
import { RolesService } from '../roles/roles.service';
import { CreateRoutePointInput, UpdateRoutePointInput } from './catalog.schemas';

const CATALOG_ROOT = 'catalog';

interface LocatedRoutePoint {
  point: RoutePoint;
  fecha: string;
}

export class CatalogService {
  constructor(
    private readonly store: DataStore,
    private readonly usersService: UsersService,
    private readonly rolesService: RolesService
  ) {}

  private pathForFecha(fecha: string): string {
    return `${CATALOG_ROOT}/${fecha}`;
  }

  async listByFecha(fecha: string): Promise<RoutePoint[]> {
    return this.store.readJson<RoutePoint[]>(this.pathForFecha(fecha), []);
  }

  async listByFechaEnriched(fecha: string): Promise<RoutePointWithAssignee[]> {
    const points = await this.listByFecha(fecha);
    return Promise.all(points.map((point) => this.enrich(point)));
  }

  private async enrich(point: RoutePoint): Promise<RoutePointWithAssignee> {
    if (!point.assignedInspectorId) {
      return { ...point, assignedInspectorName: null };
    }
    const user = await this.usersService.findUserById(point.assignedInspectorId);
    return { ...point, assignedInspectorName: user?.fullName ?? null };
  }

  private async assertValidAssignee(inspectorId: string | null | undefined): Promise<void> {
    if (!inspectorId) return;
    const user = await this.usersService.findUserById(inspectorId);
    if (!user) {
      throw badRequest('El inspector asignado no existe');
    }
    const role = await this.rolesService.findRoleById(user.roleId);
    if (!role || role.name !== 'inspector') {
      throw badRequest('Solo se puede asignar un punto a un usuario con rol inspector');
    }
  }

  async create(input: CreateRoutePointInput, createdBy: string): Promise<RoutePointWithAssignee> {
    await this.assertValidAssignee(input.assignedInspectorId);

    const points = await this.listByFecha(input.fecha);
    const now = new Date().toISOString();
    const point: RoutePoint = {
      id: uuid(),
      fecha: input.fecha,
      diaProgramado: input.diaProgramado,
      sector: input.sector,
      direccion: input.direccion,
      empresaResponsable: input.empresaResponsable,
      tipoExigencia: input.tipoExigencia,
      descripcionExigencia: input.descripcionExigencia,
      ventanaEntrada: input.ventanaEntrada,
      ventanaSalida: input.ventanaSalida,
      vigenciaDesde: input.vigenciaDesde,
      vigenciaHasta: input.vigenciaHasta,
      estadoDisponibilidad: 'disponible',
      assignedInspectorId: input.assignedInspectorId ?? null,
      createdBy,
      createdAt: now,
      updatedAt: now
    };
    points.push(point);
    await this.store.writeJson(this.pathForFecha(input.fecha), points);
    return this.enrich(point);
  }

  async findById(id: string): Promise<LocatedRoutePoint | undefined> {
    const fechas = await this.store.listChildren(CATALOG_ROOT);
    for (const fecha of fechas) {
      const points = await this.listByFecha(fecha);
      const point = points.find((candidate) => candidate.id === id);
      if (point) {
        return { point, fecha };
      }
    }
    return undefined;
  }

  async update(id: string, input: UpdateRoutePointInput): Promise<RoutePointWithAssignee> {
    const located = await this.findById(id);
    if (!located) {
      throw notFound('Punto de ruta no encontrado');
    }

    if (Object.prototype.hasOwnProperty.call(input, 'assignedInspectorId')) {
      await this.assertValidAssignee(input.assignedInspectorId);
    }

    const updated: RoutePoint = {
      ...located.point,
      ...input,
      updatedAt: new Date().toISOString()
    };

    if (updated.vigenciaHasta < updated.vigenciaDesde) {
      throw badRequest('vigenciaHasta no puede ser anterior a vigenciaDesde');
    }

    if (input.fecha && input.fecha !== located.fecha) {
      const oldList = await this.listByFecha(located.fecha);
      await this.store.writeJson(
        this.pathForFecha(located.fecha),
        oldList.filter((point) => point.id !== id)
      );
      const newList = await this.listByFecha(input.fecha);
      newList.push(updated);
      await this.store.writeJson(this.pathForFecha(input.fecha), newList);
    } else {
      const list = await this.listByFecha(located.fecha);
      const index = list.findIndex((point) => point.id === id);
      list[index] = updated;
      await this.store.writeJson(this.pathForFecha(located.fecha), list);
    }

    return this.enrich(updated);
  }

  async markAsTomado(id: string): Promise<RoutePoint> {
    const located = await this.findById(id);
    if (!located) {
      throw notFound('Punto de ruta no encontrado');
    }
    if (located.point.estadoDisponibilidad === 'tomado') {
      throw conflict('Este punto de ruta ya fue tomado por otro inspector');
    }
    return this.setDisponibilidad(located, 'tomado');
  }

  async markAsDisponible(id: string): Promise<RoutePoint> {
    const located = await this.findById(id);
    if (!located) {
      throw notFound('Punto de ruta no encontrado');
    }
    return this.setDisponibilidad(located, 'disponible');
  }

  private async setDisponibilidad(
    located: LocatedRoutePoint,
    estadoDisponibilidad: RoutePoint['estadoDisponibilidad']
  ): Promise<RoutePoint> {
    const list = await this.listByFecha(located.fecha);
    const index = list.findIndex((point) => point.id === located.point.id);
    const updated: RoutePoint = {
      ...located.point,
      estadoDisponibilidad,
      updatedAt: new Date().toISOString()
    };
    list[index] = updated;
    await this.store.writeJson(this.pathForFecha(located.fecha), list);
    return updated;
  }
}
