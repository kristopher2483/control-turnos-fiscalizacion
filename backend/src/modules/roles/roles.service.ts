import { supabase } from '../../db/supabase';
import { Role } from '../../types';
import { notFound, conflict } from '../../utils/http-error';
import { CreateRoleInput, UpdateRoleInput } from './roles.schemas';
import { RoleRow, toRole } from './roles.mapper';

export class RolesService {
  async listRoles(): Promise<Role[]> {
    const { data, error } = await supabase.from('roles').select('*').order('name');
    if (error) throw error;
    return ((data ?? []) as RoleRow[]).map(toRole);
  }

  async findRoleById(id: string): Promise<Role | undefined> {
    const { data, error } = await supabase.from('roles').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data ? toRole(data as RoleRow) : undefined;
  }

  async findRoleByName(name: string): Promise<Role | undefined> {
    const { data, error } = await supabase.from('roles').select('*').eq('name', name).maybeSingle();
    if (error) throw error;
    return data ? toRole(data as RoleRow) : undefined;
  }

  async createRole(input: CreateRoleInput): Promise<Role> {
    const existing = await this.findRoleByName(input.name);
    if (existing) {
      throw conflict(`Ya existe un rol con nombre "${input.name}"`);
    }

    const { data, error } = await supabase
      .from('roles')
      .insert({ name: input.name, label: input.label, description: input.description })
      .select()
      .single();
    if (error) throw error;
    return toRole(data as RoleRow);
  }

  async updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
    const { data, error } = await supabase.from('roles').update(input).eq('id', id).select().maybeSingle();
    if (error) throw error;
    if (!data) {
      throw notFound('Rol no encontrado');
    }
    return toRole(data as RoleRow);
  }
}
