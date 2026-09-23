import { Role, RoleName } from '../../types';

export interface RoleRow {
  id: string;
  name: string;
  label: string;
  description: string;
}

export function toRole(row: RoleRow): Role {
  return {
    id: row.id,
    name: row.name as RoleName,
    label: row.label,
    description: row.description
  };
}
