import { User } from '../../types';

export interface UserRow {
  id: string;
  username: string;
  password_hash: string;
  full_name: string;
  email: string;
  role_id: string;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    username: row.username,
    passwordHash: row.password_hash,
    fullName: row.full_name,
    email: row.email,
    roleId: row.role_id,
    active: row.active,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
