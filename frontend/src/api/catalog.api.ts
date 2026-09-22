import { apiClient } from './client'
import type { RoutePoint } from '../types'

export type CreateRoutePointInput = {
  fecha: string
  diaProgramado: string
  sector: string
  direccion: string
  empresaResponsable: string
  tipoExigencia: string
  descripcionExigencia: string
  ventanaEntrada: string
  ventanaSalida: string
  vigenciaDesde: string
  vigenciaHasta: string
  assignedInspectorId: string | null
}

export type UpdateRoutePointInput = Partial<CreateRoutePointInput> & {
  estadoDisponibilidad?: 'disponible' | 'tomado'
}

export async function fetchCatalog(fecha: string): Promise<RoutePoint[]> {
  const { data } = await apiClient.get<RoutePoint[]>('/catalog', { params: { fecha } })
  return data
}

export async function createRoutePoint(input: CreateRoutePointInput): Promise<RoutePoint> {
  const { data } = await apiClient.post<RoutePoint>('/catalog', input)
  return data
}

export async function updateRoutePoint(id: string, input: UpdateRoutePointInput): Promise<RoutePoint> {
  const { data } = await apiClient.put<RoutePoint>(`/catalog/${id}`, input)
  return data
}
