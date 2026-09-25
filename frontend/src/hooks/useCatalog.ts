import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createRoutePoint,
  fetchCatalog,
  fetchCatalogRange,
  importCatalog,
  updateRoutePoint,
  type CreateRoutePointInput,
  type FetchCatalogRangeParams,
  type UpdateRoutePointInput,
} from '../api/catalog.api'

export function useCatalogQuery(fecha: string) {
  return useQuery({
    queryKey: ['catalog', fecha],
    queryFn: () => fetchCatalog(fecha),
    enabled: Boolean(fecha),
  })
}

export function useCatalogRangeQuery(params: FetchCatalogRangeParams) {
  return useQuery({
    queryKey: ['catalog', 'range', params],
    queryFn: () => fetchCatalogRange(params),
    enabled: Boolean(params.fechaDesde && params.fechaHasta),
  })
}

export function useCreateRoutePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoutePointInput) => createRoutePoint(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useUpdateRoutePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoutePointInput }) => updateRoutePoint(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}

export function useImportCatalog() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (file: File) => importCatalog(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['catalog'] })
    },
  })
}
