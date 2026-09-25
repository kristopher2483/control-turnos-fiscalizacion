import { useMutation, useQuery } from '@tanstack/react-query'
import { exportRecordsCsv, fetchSummary, type SummaryParams } from '../api/reports.api'

export function useSummaryQuery(params: SummaryParams) {
  return useQuery({
    queryKey: ['reports', 'summary', params],
    queryFn: () => fetchSummary(params),
    enabled: Boolean(params.desde && params.hasta),
  })
}

export function useExportCsv() {
  return useMutation({
    mutationFn: (params: SummaryParams) => exportRecordsCsv(params),
  })
}
