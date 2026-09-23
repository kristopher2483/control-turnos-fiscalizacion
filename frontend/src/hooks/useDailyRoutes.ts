import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  fetchAllRoutes,
  fetchMyRoutes,
  releaseAssignment,
  takeRoutePoint,
  updateAssignment,
  uploadFiscalizacionFotos,
  type FetchAllRoutesParams,
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

export function useAllRoutesQuery(params: FetchAllRoutesParams) {
  return useQuery({
    queryKey: ['daily-routes', 'all', params],
    queryFn: () => fetchAllRoutes(params),
    enabled: Boolean(params.fecha),
  })
}

export function useTakeRoutePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: TakeRouteInput) => takeRoutePoint(input),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'mine', assignment.fecha] })
      queryClient.invalidateQueries({ queryKey: ['catalog', assignment.fecha] })
    },
  })
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateAssignmentInput }) => updateAssignment(id, input),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'mine', assignment.fecha] })
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'all'] })
    },
  })
}

export function useReleaseAssignment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => releaseAssignment(id),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'mine', assignment.fecha] })
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['catalog', assignment.fecha] })
    },
  })
}

export function useUploadFiscalizacionFotos() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, numero, files }: { id: string; numero: number; files: File[] }) =>
      uploadFiscalizacionFotos(id, numero, files),
    onSuccess: (assignment) => {
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'mine', assignment.fecha] })
      queryClient.invalidateQueries({ queryKey: ['daily-routes', 'all'] })
    },
  })
}
