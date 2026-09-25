import type { BadgeTone } from '../components/ui/Badge'
import type { EstadoAsignacion, EstadoDisponibilidad } from '../types'

export const ESTADO_ASIGNACION_LABEL: Record<EstadoAsignacion, string> = {
  pendiente: 'Pendiente',
  en_progreso: 'En progreso',
  fiscalizado: 'Fiscalizado',
  no_corresponde: 'No corresponde',
  liberado: 'Liberada',
}

export const ESTADO_ASIGNACION_TONE: Record<EstadoAsignacion, BadgeTone> = {
  pendiente: 'amber',
  en_progreso: 'blue',
  fiscalizado: 'green',
  no_corresponde: 'gray',
  liberado: 'red',
}

// 'liberado' is deliberately excluded: it's not a state you pick from the update form, it's the
// result of the dedicated "liberar ruta" action (which has the side effect of freeing the point
// for other inspectors), so it can't be selected here.
export const ESTADO_ASIGNACION_OPTIONS: EstadoAsignacion[] = ['pendiente', 'en_progreso', 'fiscalizado', 'no_corresponde']

// States from which an inspector may still release the route back to the pool.
export const ESTADOS_LIBERABLES: EstadoAsignacion[] = ['pendiente', 'en_progreso']

export const ESTADO_DISPONIBILIDAD_LABEL: Record<EstadoDisponibilidad, string> = {
  disponible: 'Disponible',
  tomado: 'Tomado',
}

export const ESTADO_DISPONIBILIDAD_TONE: Record<EstadoDisponibilidad, BadgeTone> = {
  disponible: 'green',
  tomado: 'gray',
}

export function formatDateTime(value?: string): string {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('es-CL', { dateStyle: 'short', timeStyle: 'short' })
}

export function formatDate(value?: string): string {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

export function todayIsoDate(): string {
  return isoDateDaysAgo(0)
}

export function isoDateDaysAgo(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() - days)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
