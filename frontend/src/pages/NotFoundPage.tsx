import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-slate-50 px-4 text-center">
      <p className="text-6xl font-semibold text-primary-600">404</p>
      <h1 className="text-lg font-semibold text-slate-900">Página no encontrada</h1>
      <p className="max-w-sm text-sm text-slate-500">La página que buscas no existe o fue movida.</p>
      <Link to="/">
        <Button>Volver al inicio</Button>
      </Link>
    </div>
  )
}
