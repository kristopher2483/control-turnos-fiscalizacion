import { useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { CreateRoutePointModal } from '../components/CreateRoutePointModal'
import { EditRoutePointModal } from '../components/EditRoutePointModal'
import { useCatalogQuery } from '../hooks/useCatalog'
import { getApiErrorMessage } from '../api/client'
import { ESTADO_DISPONIBILIDAD_LABEL, ESTADO_DISPONIBILIDAD_TONE, formatDate, todayIsoDate } from '../utils/estado'
import type { RoutePoint } from '../types'

export function AdminCatalogPage() {
  const [fecha, setFecha] = useState(todayIsoDate())
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<RoutePoint | null>(null)

  const catalogQuery = useCatalogQuery(fecha)

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Catálogo de puntos</h1>
          <p className="mt-0.5 text-sm text-slate-500">Crea y edita los puntos de inspección disponibles para cada fecha.</p>
        </div>
        <div className="flex items-end gap-3">
          <Input label="Fecha" type="date" value={fecha} onChange={(event) => setFecha(event.target.value)} />
          <Button onClick={() => setIsCreateOpen(true)}>Nuevo punto</Button>
        </div>
      </div>

      {catalogQuery.isPending ? (
        <Spinner />
      ) : catalogQuery.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(catalogQuery.error)}</p>
      ) : (catalogQuery.data ?? []).length === 0 ? (
        <EmptyState title="No hay puntos para esta fecha" description="Crea un nuevo punto de inspección para comenzar." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Sector</th>
                  <th className="px-4 py-3">Dirección</th>
                  <th className="px-4 py-3">Empresa</th>
                  <th className="px-4 py-3">Exigencia</th>
                  <th className="px-4 py-3">Horario</th>
                  <th className="px-4 py-3">Vigencia ETO</th>
                  <th className="px-4 py-3">Asignado</th>
                  <th className="px-4 py-3">Disponibilidad</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(catalogQuery.data ?? []).map((point) => (
                  <tr key={point.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 font-medium text-slate-800">{point.sector}</td>
                    <td className="px-4 py-3 text-slate-600">{point.direccion}</td>
                    <td className="px-4 py-3 text-slate-600">{point.empresaResponsable}</td>
                    <td className="px-4 py-3 text-slate-600">{point.tipoExigencia}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {point.ventanaEntrada} – {point.ventanaSalida}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatDate(point.vigenciaDesde)} – {formatDate(point.vigenciaHasta)}
                    </td>
                    <td className="px-4 py-3 text-slate-600">{point.assignedInspectorName ?? 'Sin asignar'}</td>
                    <td className="px-4 py-3">
                      <Badge tone={ESTADO_DISPONIBILIDAD_TONE[point.estadoDisponibilidad]} dot>
                        {ESTADO_DISPONIBILIDAD_LABEL[point.estadoDisponibilidad]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button variant="outline" size="sm" onClick={() => setEditingPoint(point)}>
                        Editar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateRoutePointModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} fecha={fecha} />
      <EditRoutePointModal isOpen={Boolean(editingPoint)} onClose={() => setEditingPoint(null)} point={editingPoint} />
    </div>
  )
}
