import { useMemo, useState } from 'react'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { RoutePointCard } from '../components/RoutePointCard'
import { AssignmentCard } from '../components/AssignmentCard'
import { RouteUpdateModal } from '../components/RouteUpdateModal'
import { useCatalogQuery } from '../hooks/useCatalog'
import { useMyRoutesQuery, useTakeRoutePoint } from '../hooks/useDailyRoutes'
import { useAuth } from '../hooks/useAuth'
import { todayIsoDate } from '../utils/estado'
import { getApiErrorMessage } from '../api/client'
import type { DailyRouteAssignment } from '../types'

export function InspectorRoutePage() {
  const { user } = useAuth()
  const [fecha, setFecha] = useState(todayIsoDate())
  const [selectedAssignment, setSelectedAssignment] = useState<DailyRouteAssignment | null>(null)

  const catalogQuery = useCatalogQuery(fecha)
  const myRoutesQuery = useMyRoutesQuery(fecha)
  const takeMutation = useTakeRoutePoint()

  // A point pre-assigned by the admin to another inspector can only be taken by that inspector —
  // hide it here so it doesn't show up as takeable to everyone else. Unassigned points, and ones
  // assigned to the current inspector, still show normally.
  const availablePoints = useMemo(
    () =>
      (catalogQuery.data ?? []).filter(
        (point) =>
          point.estadoDisponibilidad === 'disponible' &&
          (!point.assignedInspectorId || point.assignedInspectorId === user?.id),
      ),
    [catalogQuery.data, user?.id],
  )

  // Once liberada, a route point moves back to "Puntos disponibles para tomar" for anyone to take;
  // it no longer belongs in this inspector's own daily route view (it still exists for admin/reports).
  const myRoutes = useMemo(
    () => (myRoutesQuery.data ?? []).filter((assignment) => assignment.estado !== 'liberado'),
    [myRoutesQuery.data],
  )

  const pendingTakeId = takeMutation.isPending ? takeMutation.variables?.routePointId : undefined

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Mi ruta</h1>
          <p className="mt-0.5 text-sm text-slate-500">Revisa los puntos disponibles y actualiza tus visitas del día.</p>
        </div>
        <div className="w-full sm:w-56">
          <Input label="Fecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
        </div>
      </div>

      {takeMutation.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(takeMutation.error)}</p>
      ) : null}

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Puntos disponibles para tomar</h2>
        {catalogQuery.isPending ? (
          <Spinner />
        ) : catalogQuery.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(catalogQuery.error)}</p>
        ) : availablePoints.length === 0 ? (
          <EmptyState
            title="No hay puntos disponibles"
            description="No quedan puntos de inspección sin tomar para la fecha seleccionada."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {availablePoints.map((point) => (
              <RoutePointCard
                key={point.id}
                point={point}
                isTaking={pendingTakeId === point.id}
                onTake={() => takeMutation.mutate({ routePointId: point.id, fecha })}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 text-base font-semibold text-slate-900">Mi ruta de hoy</h2>
        {myRoutesQuery.isPending ? (
          <Spinner />
        ) : myRoutesQuery.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(myRoutesQuery.error)}</p>
        ) : myRoutes.length === 0 ? (
          <EmptyState title="Aún no has tomado puntos" description="Toma un punto disponible arriba para comenzar tu ruta." />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {myRoutes.map((assignment) => (
              <AssignmentCard key={assignment.id} assignment={assignment} onOpenUpdate={() => setSelectedAssignment(assignment)} />
            ))}
          </div>
        )}
      </section>

      <RouteUpdateModal isOpen={Boolean(selectedAssignment)} onClose={() => setSelectedAssignment(null)} assignment={selectedAssignment} />
    </div>
  )
}
