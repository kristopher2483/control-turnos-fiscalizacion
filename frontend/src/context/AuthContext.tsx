import type { ReactNode } from 'react'
import { createContext, useCallback, useMemo } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchMe, login as loginRequest, type MeResponse } from '../api/auth.api'
import { getApiErrorMessage, TOKEN_STORAGE_KEY } from '../api/client'

export type AuthContextValue = {
  user: MeResponse | null
  isAuthenticated: boolean
  isLoadingUser: boolean
  login: (username: string, password: string) => Promise<MeResponse>
  logout: () => void
  isLoggingIn: boolean
  loginError: string | null
}

export const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const hasToken = Boolean(localStorage.getItem(TOKEN_STORAGE_KEY))

  const meQuery = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: fetchMe,
    enabled: hasToken,
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const loginMutation = useMutation({
    mutationFn: ({ username, password }: { username: string; password: string }) => loginRequest(username, password),
    onSuccess: (data) => {
      localStorage.setItem(TOKEN_STORAGE_KEY, data.token)
      queryClient.setQueryData(['auth', 'me'], data.user)
    },
  })

  const login = useCallback(
    async (username: string, password: string) => {
      const data = await loginMutation.mutateAsync({ username, password })
      return data.user
    },
    [loginMutation],
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    queryClient.setQueryData(['auth', 'me'], null)
    queryClient.clear()
    window.location.href = '/login'
  }, [queryClient])

  const value = useMemo<AuthContextValue>(
    () => ({
      user: meQuery.data ?? null,
      isAuthenticated: Boolean(meQuery.data),
      isLoadingUser: hasToken && meQuery.isPending,
      login,
      logout,
      isLoggingIn: loginMutation.isPending,
      loginError: loginMutation.error ? getApiErrorMessage(loginMutation.error, 'Usuario o contraseña incorrectos.') : null,
    }),
    [meQuery.data, meQuery.isPending, hasToken, login, logout, loginMutation.isPending, loginMutation.error],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
