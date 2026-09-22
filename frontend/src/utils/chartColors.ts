import type { EstadoAsignacion } from '../types'

// Validated status/categorical palette (see dataviz skill reference palette).
export const ESTADO_CHART_COLOR: Record<EstadoAsignacion, string> = {
  pendiente: '#fab219',
  en_progreso: '#2a78d6',
  fiscalizado: '#0ca30c',
  no_corresponde: '#898781',
  liberado: '#d6432f',
}

export const SECTOR_BAR_COLOR = '#2a78d6'
