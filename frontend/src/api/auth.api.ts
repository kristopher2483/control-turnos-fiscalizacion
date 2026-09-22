import { apiClient } from './client'
import type { LoginResponse, Role } from '../types'

export type MeResponse = {
  id: string
  username: string
  fullName: string
  email: string
  role: Role
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { username, password })
  return data
}

export async function fetchMe(): Promise<MeResponse> {
  const { data } = await apiClient.get<MeResponse>('/auth/me')
  return data
}
