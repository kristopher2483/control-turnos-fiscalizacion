import { supabase } from '../../db/supabase';
import { PublicUser, User } from '../../types';
import { RolesService } from '../roles/roles.service';
import { hashPassword } from '../../utils/password';
import { badRequest, conflict, notFound } from '../../utils/http-error';
import { CreateUserInput, UpdateUserInput } from './users.schemas';
import { toUser, UserRow } from './users.mapper';

export class UsersService {
  constructor(private readonly rolesService: RolesService) {}

  async listUsers(): Promise<User[]> {
    const { data, error } = await supabase.from('users').select('*').order('created_at');
    if (error) throw error;
    return ((data ?? []) as UserRow[]).map(toUser);
  }

  async findUserById(id: string): Promise<User | undefined> {
    const { data, error } = await supabase.from('users').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toUser(data as UserRow) : undefined;
  }

  async findUserByUsername(username: string): Promise<User | undefined> {
    // ilike with no % wildcards is an exact, case-insensitive match — fine for our usernames,
    // which never contain literal "%" or "_".
    const { data, error } = await supabase.from('users').select('*').ilike('username', username).maybeSingle();
    if (error) throw error;
    return data ? toUser(data as UserRow) : undefined;
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
    const existing = await this.findUserByUsername(input.username);
    if (existing) {
      throw conflict(`Ya existe un usuario con username "${input.username}"`);
    }

    const role = await this.rolesService.findRoleById(input.roleId);
    if (!role) {
      throw badRequest(`roleId "${input.roleId}" no corresponde a un rol existente`);
    }

    const { data, error } = await supabase
      .from('users')
      .insert({
        username: input.username,
        password_hash: await hashPassword(input.password),
        full_name: input.fullName,
        email: input.email,
        role_id: input.roleId,
        active: true
      })
      .select()
      .single();
    if (error) throw error;
    return this.toPublicUser(toUser(data as UserRow));
  }

  async updateUser(id: string, input: UpdateUserInput): Promise<PublicUser> {
    if (input.roleId) {
      const role = await this.rolesService.findRoleById(input.roleId);
      if (!role) {
        throw badRequest(`roleId "${input.roleId}" no corresponde a un rol existente`);
      }
    }
    if (input.username) {
      const existing = await this.findUserByUsername(input.username);
      if (existing && existing.id !== id) {
        throw conflict(`Ya existe un usuario con username "${input.username}"`);
      }
    }

    const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (input.username !== undefined) patch.username = input.username;
    if (input.fullName !== undefined) patch.full_name = input.fullName;
    if (input.email !== undefined) patch.email = input.email;
    if (input.roleId !== undefined) patch.role_id = input.roleId;
    if (input.active !== undefined) patch.active = input.active;

    const { data, error } = await supabase.from('users').update(patch).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) {
      throw notFound('Usuario no encontrado');
    }
    return this.toPublicUser(toUser(data as UserRow));
  }

  async updateUserPassword(id: string, newPassword: string): Promise<void> {
    const { data, error } = await supabase
      .from('users')
      .update({ password_hash: await hashPassword(newPassword), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) {
      throw notFound('Usuario no encontrado');
    }
  }
}
