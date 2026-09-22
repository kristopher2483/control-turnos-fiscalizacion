import { apiClient } from './client'
import type { Role } from '../types'

export type CreateRoleInput = {
  name: string
  label: string
  description: string
}

export type UpdateRoleInput = {
  label?: string
  description?: string
}

export async function fetchRoles(): Promise<Role[]> {
  const { data } = await apiClient.get<Role[]>('/roles')
  return data
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  const { data } = await apiClient.post<Role>('/roles', input)
  return data
}

export async function updateRole(id: string, input: UpdateRoleInput): Promise<Role> {
  const { data } = await apiClient.put<Role>(`/roles/${id}`, input)
  return data
}
