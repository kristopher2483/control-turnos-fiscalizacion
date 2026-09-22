import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner } from '../components/ui/Spinner'

export function RootRedirect() {
  const { isAuthenticated, isLoadingUser, user } = useAuth()

  if (isLoadingUser) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Spinner label="Cargando…" />
      </div>
    )
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={user.role.name === 'admin' ? '/admin' : '/mi-ruta'} replace />
}
