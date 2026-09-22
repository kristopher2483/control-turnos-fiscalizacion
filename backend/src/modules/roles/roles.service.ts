import { v4 as uuid } from 'uuid';
import { DataStore } from '../../storage/storage.interface';
import { Role } from '../../types';
import { notFound, conflict } from '../../utils/http-error';
import { CreateRoleInput, UpdateRoleInput } from './roles.schemas';

const ROLES_PATH = 'roles';

export class RolesService {
  constructor(private readonly store: DataStore) {}

  async listRoles(): Promise<Role[]> {
    return this.store.readJson<Role[]>(ROLES_PATH, []);
  }

  async findRoleById(id: string): Promise<Role | undefined> {
    const roles = await this.listRoles();
    return roles.find((role) => role.id === id);
  }

  async findRoleByName(name: string): Promise<Role | undefined> {
    const roles = await this.listRoles();
    return roles.find((role) => role.name === name);
  }

  async createRole(input: CreateRoleInput): Promise<Role> {
    const roles = await this.listRoles();
    if (roles.some((role) => role.name === input.name)) {
      throw conflict(`Ya existe un rol con nombre "${input.name}"`);
    }
    const role: Role = {
      id: uuid(),
      name: input.name,
      label: input.label,
      description: input.description
    };
    roles.push(role);
    await this.store.writeJson(ROLES_PATH, roles);
    return role;
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    const roles = await this.listRoles();
    const index = roles.findIndex((role) => role.id === id);
    if (index === -1) {
      throw notFound('Rol no encontrado');
    }
    const updated: Role = { ...roles[index], ...input };
    roles[index] = updated;
    await this.store.writeJson(ROLES_PATH, roles);
    return updated;
  }
}
