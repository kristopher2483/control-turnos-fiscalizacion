import { useQuery } from '@tanstack/react-query'
import { fetchRoles } from '../api/roles.api'

export function useRolesQuery() {
  return useQuery({
    queryKey: ['roles'],
    queryFn: fetchRoles,
    staleTime: 5 * 60 * 1000,
  })
}
