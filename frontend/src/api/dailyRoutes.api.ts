import { apiClient } from './client'
import type { DailyRouteAssignment, EstadoAsignacion } from '../types'

export type TakeRouteInput = {
  routePointId: string
  fecha: string
}

export type UpdateAssignmentInput = {
  estado?: EstadoAsignacion
  observaciones?: string
  horaLlegada?: string
  horaSalida?: string
  nuevaFiscalizacion?: { comentario: string }
}

export async function fetchMyRoutes(fecha: string): Promise<DailyRouteAssignment[]> {
  const { data } = await apiClient.get<DailyRouteAssignment[]>('/daily-routes/mine', { params: { fecha } })
  return data
}

export async function takeRoutePoint(input: TakeRouteInput): Promise<DailyRouteAssignment> {
  const { data } = await apiClient.post<DailyRouteAssignment>('/daily-routes/take', input)
  return data
}

export async function updateAssignment(id: string, input: UpdateAssignmentInput): Promise<DailyRouteAssignment> {
  const { data } = await apiClient.put<DailyRouteAssignment>(`/daily-routes/${id}`, input)
  return data
}

export async function releaseAssignment(id: string): Promise<DailyRouteAssignment> {
  const { data } = await apiClient.post<DailyRouteAssignment>(`/daily-routes/${id}/release`)
  return data
}

export type FetchAllRoutesParams = {
  fecha?: string
  inspectorId?: string
}

export async function fetchAllRoutes(params: FetchAllRoutesParams): Promise<DailyRouteAssignment[]> {
  const { data } = await apiClient.get<DailyRouteAssignment[]>('/daily-routes', { params })
  return data
}
