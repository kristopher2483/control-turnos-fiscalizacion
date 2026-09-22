import { Card, CardBody } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { RoutePoint } from '../types'
import { formatDate } from '../utils/estado'

type RoutePointCardProps = {
  point: RoutePoint
  onTake: () => void
  isTaking?: boolean
}

export function RoutePointCard({ point, onTake, isTaking }: RoutePointCardProps) {
  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-slate-900">{point.sector}</p>
            <p className="text-sm text-slate-600">{point.direccion}</p>
          </div>
          <Badge tone="green" dot>
            Disponible
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Empresa</dt>
            <dd className="text-slate-700">{point.empresaResponsable}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Exigencia</dt>
            <dd className="text-slate-700">{point.tipoExigencia}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Ventana horaria</dt>
            <dd className="text-slate-700">
              {point.ventanaEntrada} – {point.ventanaSalida}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Día programado</dt>
            <dd className="text-slate-700">{point.diaProgramado}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Vigencia ETO</dt>
            <dd className="text-slate-700">
              {formatDate(point.vigenciaDesde)} – {formatDate(point.vigenciaHasta)}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Asignado a</dt>
            <dd className="text-slate-700">{point.assignedInspectorName ?? 'Sin asignar'}</dd>
          </div>
        </dl>

        {point.descripcionExigencia ? <p className="text-sm text-slate-500">{point.descripcionExigencia}</p> : null}

        <div className="mt-auto pt-2">
          <Button onClick={onTake} isLoading={isTaking} fullWidth>
            Tomar esta ruta
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
