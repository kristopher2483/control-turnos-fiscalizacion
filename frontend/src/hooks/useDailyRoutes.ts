import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  deleteFiscalizacionFoto,
  fetchAllRoutes,
  fetchMyRoutes,
  fetchMyRoutesRange,
  releaseAssignment,
  reprogramAssignment,
  takeRoutePoint,
  updateAssignment,
  uploadFiscalizacionFotos,
  type FetchAllRoutesParams,
  type FetchMyRoutesRangeParams,
  type TakeRouteInput,
  type UpdateAssignmentInput,
} from '../api/dailyRoutes.api'

export function useMyRoutesQuery(fecha: string) {
  return useQuery({
    queryKey: ['daily-routes', 'mine', fecha],
    queryFn: () => fetchMyRoutes(fecha),
    enabled: Boolean(fecha),
  })
}

export function useMyRoutesRangeQuery(params: FetchMyRoutesRangeParams) {
  return useQuery({
    queryKey: ['daily-routes', 'mine-range', params],
    queryFn: () => fetchMyRoutesRange(params),
    enabled: Boolean(params.fechaDesde && params.fechaHasta),
  })
}

export function useAllRoutesQuery(params: FetchAllRoutesParams) {
  return useQuery({
    queryKey: ['daily-routes', 'all', params],
    queryFn: () => fetchAllRoutes(params),
    enabled: Boolean(params.fechaDesde && params.fechaHasta),
  })
}

export function useTakeRoutePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TakeRouteInput) => takeRoutePoint(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssignmentInput }) => updateAssignment(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] })
    },
  })
}

export function useReleaseAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => releaseAssignment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] })
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useReprogramAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, fecha }: { id: string; fecha: string }) => reprogramAssignment(id, fecha),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] })
    },
  })
}

export function useUploadFiscalizacionFotos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, numero, files }: { id: string; numero: number; files: File[] }) =>
      uploadFiscalizacionFotos(id, numero, files),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] })
    },
  })
}

export function useDeleteFiscalizacionFoto() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, numero, index }: { id: string; numero: number; index: number }) =>
      deleteFiscalizacionFoto(id, numero, index),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes'] })
    },
  })
}
