import { apiClient } from './client'
import type { User } from '../types'

export type CreateUserInput = {
  username: string
  fullName: string
  email: string
  password: string
  roleId: string
}

export type UpdateUserInput = {
  username?: string
  fullName?: string
  email?: string
  roleId?: string
  active?: boolean
}

export async function fetchUsers(): Promise<User[]> {
  const { data } = await apiClient.get<User[]>('/users')
  return data
}

export async function createUser(input: CreateUserInput): Promise<User> {
  const { data } = await apiClient.post<User>('/users', input)
  return data
}

export async function updateUser(id: string, input: UpdateUserInput): Promise<User> {
  const { data } = await apiClient.put<User>(`/users/${id}`, input)
  return data
}

export async function resetUserPassword(id: string, newPassword: string): Promise<void> {
  await apiClient.put(`/users/${id}/password`, { newPassword })
}
