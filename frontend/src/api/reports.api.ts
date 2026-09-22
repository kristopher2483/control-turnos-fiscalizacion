import { apiClient } from './client'
import type { ReportSummary } from '../types'

export type SummaryParams = {
  desde: string
  hasta: string
}

export async function fetchSummary(params: SummaryParams): Promise<ReportSummary> {
  const { data } = await apiClient.get<ReportSummary>('/reports/summary', { params })
  return data
}

export async function exportRecordsCsv(fecha: string): Promise<void> {
  const response = await apiClient.get('/reports/export.csv', {
    params: { fecha },
    responseType: 'blob',
  })
  const url = window.URL.createObjectURL(new Blob([response.data]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', `registros-${fecha}.csv`)
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
