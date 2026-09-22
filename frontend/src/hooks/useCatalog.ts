import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createRoutePoint, fetchCatalog, updateRoutePoint, type CreateRoutePointInput, type UpdateRoutePointInput } from '../api/catalog.api'

export function useCatalogQuery(fecha: string) {
  return useQuery({
    queryKey: ['catalog', fecha],
    queryFn: () => fetchCatalog(fecha),
    enabled: Boolean(fecha),
  })
}

export function useCreateRoutePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateRoutePointInput) => createRoutePoint(input),
    onSuccess: (point) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', point.fecha] })
    },
  })
}

export function useUpdateRoutePoint() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateRoutePointInput }) => updateRoutePoint(id, input),
    onSuccess: (point) => {
      queryClient.invalidateQueries({ queryKey: ['catalog', point.fecha] })
    },
  })
}
