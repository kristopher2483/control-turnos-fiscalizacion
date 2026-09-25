import { Card, CardBody } from './ui/Card'
import { Button } from './ui/Button'
import { Badge } from './ui/Badge'
import type { DailyRouteAssignment } from '../types'
import { ESTADO_ASIGNACION_LABEL, ESTADO_ASIGNACION_TONE, formatDate, formatDateTime } from '../utils/estado'

type AssignmentCardProps = {
  assignment: DailyRouteAssignment
  onOpenUpdate: () => void
  showFecha?: boolean
}

export function AssignmentCard({ assignment, onOpenUpdate, showFecha }: AssignmentCardProps) {
  const { snapshot } = assignment

  return (
    <Card className="flex flex-col">
      <CardBody className="flex flex-1 flex-col gap-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            {showFecha ? <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{formatDate(assignment.fecha)}</p> : null}
            <p className="text-sm font-semibold text-slate-900">{snapshot.sector}</p>
            <p className="text-sm text-slate-600">{snapshot.direccion}</p>
          </div>
          <Badge tone={ESTADO_ASIGNACION_TONE[assignment.estado]} dot>
            {ESTADO_ASIGNACION_LABEL[assignment.estado]}
          </Badge>
        </div>

        <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-sm">
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Empresa</dt>
            <dd className="text-slate-700">{snapshot.empresaResponsable}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Exigencia</dt>
            <dd className="text-slate-700">{snapshot.tipoExigencia}</dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Ventana horaria</dt>
            <dd className="text-slate-700">
              {snapshot.ventanaEntrada} – {snapshot.ventanaSalida}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">Llegada / Salida</dt>
            <dd className="text-slate-700">
              {assignment.horaLlegada ?? '—'} / {assignment.horaSalida ?? '—'}
            </dd>
          </div>
        </dl>

        {assignment.observaciones ? (
          <div className="rounded-xl bg-slate-50 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-400">Observaciones</p>
            <p className="mt-0.5 text-sm text-slate-700">{assignment.observaciones}</p>
          </div>
        ) : null}

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            Fiscalizaciones ({assignment.fiscalizaciones.length})
          </p>
          {assignment.fiscalizaciones.length === 0 ? (
            <p className="mt-1 text-sm text-slate-400">Aún no se han registrado visitas.</p>
          ) : (
            <ol className="mt-2 space-y-2 border-l-2 border-slate-100 pl-3">
              {assignment.fiscalizaciones.map((f) => (
                <li key={f.numero} className="text-sm">
                  <p className="font-medium text-slate-700">
                    #{f.numero} · {formatDateTime(f.horaRegistro)}
                  </p>
                  <p className="text-slate-500">{f.comentario}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <div className="mt-auto pt-2">
          <Button onClick={onOpenUpdate} variant="outline" fullWidth>
            {assignment.estado === 'liberado' || assignment.estado === 'fiscalizado' ? 'Ver detalle' : 'Actualizar'}
          </Button>
        </div>
      </CardBody>
    </Card>
  )
}
