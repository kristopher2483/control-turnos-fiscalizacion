import { useMemo, useState } from 'react'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { AssignmentCard } from '../components/AssignmentCard'
import { RouteUpdateModal } from '../components/RouteUpdateModal'
import { useMyRoutesRangeQuery } from '../hooks/useDailyRoutes'
import { getApiErrorMessage } from '../api/client'
import { ESTADO_ASIGNACION_LABEL, ESTADO_ASIGNACION_OPTIONS, isoDateDaysAgo, todayIsoDate } from '../utils/estado'
import type { DailyRouteAssignment, EstadoAsignacion } from '../types'

export function InspectorRouteDetailPage() {
  const [fechaDesde, setFechaDesde] = useState(isoDateDaysAgo(29))
  const [fechaHasta, setFechaHasta] = useState(todayIsoDate())
  const [estado, setEstado] = useState<EstadoAsignacion | ''>('')
  const [selectedAssignment, setSelectedAssignment] = useState<DailyRouteAssignment | null>(null)

  const rangoInvalido = fechaDesde > fechaHasta
  const routesQuery = useMyRoutesRangeQuery(
    rangoInvalido ? { fechaDesde: '', fechaHasta: '' } : { fechaDesde, fechaHasta, estado: estado || undefined },
  )

  const pendientesCount = useMemo(
    () => (routesQuery.data ?? []).filter((a) => a.estado === 'pendiente' || a.estado === 'en_progreso').length,
    [routesQuery.data],
  )

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Detalle de mi ruta</h1>
        <p className="mt-0.5 text-sm text-slate-500">
          Consulta el estado de todos tus registros por fecha, y filtra para ver rápidamente lo que todavía te falta
          fiscalizar.
        </p>
      </div>

      {!routesQuery.isPending && !routesQuery.isError && pendientesCount > 0 ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          Tienes <span className="font-semibold">{pendientesCount}</span> ruta{pendientesCount === 1 ? '' : 's'} pendiente
          {pendientesCount === 1 ? '' : 's'} o en progreso en el rango seleccionado.
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
        <div className="w-full sm:w-48">
          <Input label="Desde" type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Input label="Hasta" type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} />
        </div>
        <div className="w-full sm:w-56">
          <Select label="Estado" value={estado} onChange={(event) => setEstado(event.target.value as EstadoAsignacion | '')}>
            <option value="">Todos los estados</option>
            {ESTADO_ASIGNACION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {ESTADO_ASIGNACION_LABEL[option]}
              </option>
            ))}
            <option value="liberado">{ESTADO_ASIGNACION_LABEL.liberado}</option>
          </Select>
        </div>
      </div>

      {rangoInvalido ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          La fecha "Desde" no puede ser posterior a la fecha "Hasta".
        </p>
      ) : null}

      {rangoInvalido ? null : routesQuery.isPending ? (
        <Spinner />
      ) : routesQuery.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(routesQuery.error)}</p>
      ) : (routesQuery.data ?? []).length === 0 ? (
        <EmptyState title="Sin registros" description="No hay rutas registradas para los filtros seleccionados." />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {(routesQuery.data ?? []).map((assignment) => (
            <AssignmentCard
              key={assignment.id}
              assignment={assignment}
              onOpenUpdate={() => setSelectedAssignment(assignment)}
              showFecha
            />
          ))}
        </div>
      )}

      <RouteUpdateModal
        isOpen={Boolean(selectedAssignment)}
        onClose={() => setSelectedAssignment(null)}
        assignment={selectedAssignment}
      />
    </div>
  )
}
