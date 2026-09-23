import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { FotosViewerModal } from '../components/FotosViewerModal'
import { useAllRoutesQuery } from '../hooks/useDailyRoutes'
import { useUsersQuery } from '../hooks/useUsers'
import { useExportCsv } from '../hooks/useReports'
import { getApiErrorMessage } from '../api/client'
import { ESTADO_ASIGNACION_LABEL, ESTADO_ASIGNACION_TONE, todayIsoDate } from '../utils/estado'
import type { DailyRouteAssignment } from '../types'

export function AdminRecordsPage() {
  const [fecha, setFecha] = useState(todayIsoDate())
  const [inspectorId, setInspectorId] = useState('')
  const [viewingFotosFor, setViewingFotosFor] = useState<DailyRouteAssignment | null>(null)

  const usersQuery = useUsersQuery()
  const inspectors = useMemo(() => (usersQuery.data ?? []).filter((user) => user.role.name === 'inspector'), [usersQuery.data])

  const routesQuery = useAllRoutesQuery({ fecha, inspectorId: inspectorId || undefined })
  const exportCsvMutation = useExportCsv()

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Registros de fiscalización</h1>
          <p className="mt-0.5 text-sm text-slate-500">Consulta las visitas registradas por todos los inspectores.</p>
        </div>
        <Button variant="outline" onClick={() => exportCsvMutation.mutate(fecha)} isLoading={exportCsvMutation.isPending}>
          Exportar CSV
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="w-full sm:w-56">
          <Input label="Fecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
        </div>
        <div className="w-full sm:w-64">
          <Select label="Inspector" value={inspectorId} onChange={(event) => setInspectorId(event.target.value)}>
            <option value="">Todos los inspectores</option>
            {inspectors.map((inspector) => (
              <option key={inspector.id} value={inspector.id}>
                {inspector.fullName}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {exportCsvMutation.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(exportCsvMutation.error)}</p>
      ) : null}

      {routesQuery.isPending ? (
        <Spinner />
      ) : routesQuery.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(routesQuery.error)}</p>
      ) : (routesQuery.data ?? []).length === 0 ? (
        <EmptyState title="Sin registros" description="No hay visitas registradas para los filtros seleccionados." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Inspector</th>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Dirección</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3">Observaciones</th>
                  <th className="px-4 py-3 text-center">Fiscalizaciones</th>
                  <th className="px-4 py-3">Llegada / Salida</th>
                  <th className="px-4 py-3 text-right">Fotos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(routesQuery.data ?? []).map((assignment) => {
                  const cantidadFotos = assignment.fiscalizaciones.reduce((total, f) => total + f.fotos.length, 0)
                  return (
                    <tr key={assignment.id} className="hover:bg-slate-50/60">
                      <td className="px-4 py-3 font-medium text-slate-800">{assignment.inspectorUsername}</td>
                      <td className="px-4 py-3 text-slate-600">{assignment.snapshot.sector}</td>
                      <td className="px-4 py-3 text-slate-600">{assignment.snapshot.direccion}</td>
                      <td className="px-4 py-3 text-slate-600">{assignment.snapshot.empresaResponsable}</td>
                      <td className="px-4 py-3">
                        <Badge tone={ESTADO_ASIGNACION_TONE[assignment.estado]} dot>
                          {ESTADO_ASIGNACION_LABEL[assignment.estado]}
                        </Badge>
                      </td>
                      <td className="max-w-xs truncate px-4 py-3 text-slate-600" title={assignment.observaciones}>
                        {assignment.observaciones || '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{assignment.fiscalizaciones.length}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {assignment.horaLlegada ?? '—'} / {assignment.horaSalida ?? '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={cantidadFotos === 0}
                          onClick={() => setViewingFotosFor(assignment)}
                        >
                          Ver ({cantidadFotos})
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <FotosViewerModal isOpen={Boolean(viewingFotosFor)} onClose={() => setViewingFotosFor(null)} assignment={viewingFotosFor} />
    </div>
  )
}
