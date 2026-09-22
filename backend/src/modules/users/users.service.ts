import { v4 as uuid } from 'uuid';
import { DataStore } from '../../storage/storage.interface';
import { PublicUser, User } from '../../types';
import { RolesService } from '../roles/roles.service';
import { hashPassword } from '../../utils/password';
import { badRequest, conflict, notFound } from '../../utils/http-error';
import { CreateUserInput, UpdateUserInput } from './users.schemas';

const USERS_PATH = 'users';

export class UsersService {
  constructor(private readonly store: DataStore, private readonly rolesService: RolesService) {}

  async listUsers(): Promise<User[]> {
    return this.store.readJson<User[]>(USERS_PATH, []);
  }

  async findUserById(id: string): Promise<User | undefined> {
    const users = await this.listUsers();
    return users.find((user) => user.id === id);
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.listUsers();
    return users.find((user) => user.username.toLowerCase() === username.toLowerCase());
  }

  async toPublicUser(user: User): Promise<PublicUser> {
    const role = await this.rolesService.findRoleById(user.roleId);
    if (!role) {
      throw notFound(`El usuario "${user.username}" tiene un rol inexistente`);
    }
    return {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      email: user.email,
      roleId: user.roleId,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      role
    };
  }

  async listPublicUsers(): Promise<PublicUser[]> {
    const users = await this.listUsers();
    return Promise.all(users.map((user) => this.toPublicUser(user)));
  }

  async createUser(input: CreateUserInput): Promise<PublicUser> {
    const users = await this.listUsers();

    if (users.some((user) => user.username.toLowerCase() === input.username.toLowerCase())) {
      throw conflict(`Ya existe un usuario con username "${input.username}"`);
    }

    const role = await this.rolesService.findRoleById(input.roleId);
    if (!role) {
      throw badRequest(`roleId "${input.roleId}" no corresponde a un rol existente`);
    }

    const now = new Date().toISOString();
    const user: User = {
      id: uuid(),
      username: input.username,
      passwordHash: await hashPassword(input.password),
      fullName: input.fullName,
      email: input.email,
      roleId: input.roleId,
      active: true,
      createdAt: now,
      updatedAt: now
    };

    users.push(user);
    await this.store.writeJson(USERS_PATH, users);
    return this.toPublicUser(user);
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<PublicUser> {
    const users = await this.listUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw notFound('Usuario no encontrado');
    }

    if (input.roleId) {
      const role = await this.rolesService.findRoleById(input.roleId);
      if (!role) {
        throw badRequest(`roleId "${input.roleId}" no corresponde a un rol existente`);
      }
    }

    const updated: User = {
      ...users[index],
      ...input,
      updatedAt: new Date().toISOString()
    };
    users[index] = updated;
    await this.store.writeJson(USERS_PATH, users);
    return this.toPublicUser(updated);
  }

  async updateUserPassword(id: string, newPassword: string): Promise<void> {
    const users = await this.listUsers();
    const index = users.findIndex((user) => user.id === id);
    if (index === -1) {
      throw notFound('Usuario no encontrado');
    }
    users[index] = {
      ...users[index],
      passwordHash: await hashPassword(newPassword),
      updatedAt: new Date().toISOString()
    };
    await this.store.writeJson(USERS_PATH, users);
  }
}
