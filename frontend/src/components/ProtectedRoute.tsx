import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from './ui/Spinner'
import type { Role } from '../types'

type ProtectedRouteProps = {
  children: ReactNode
  allowedRoles?: Array<Role['name']>
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoadingUser, user } = useAuth()

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Verificando sesión…" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles && !allowedRoles.includes(user.role.name)) {
    const fallback = user.role.name === 'admin' ? '/admin' : '/mi-ruta'
    return <Navigate to={fallback} replace />
  }

  return <>{children}</>
}
