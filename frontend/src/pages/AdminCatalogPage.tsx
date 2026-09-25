import { useMemo, useState } from 'react'
import { Card } from '../components/ui/Card'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Input } from '../components/ui/Input'
import { Select } from '../components/ui/Select'
import { Spinner } from '../components/ui/Spinner'
import { EmptyState } from '../components/ui/EmptyState'
import { CreateRoutePointModal } from '../components/CreateRoutePointModal'
import { EditRoutePointModal } from '../components/EditRoutePointModal'
import { ReprogramarPuntoModal } from '../components/ReprogramarPuntoModal'
import { ImportCatalogModal } from '../components/ImportCatalogModal'
import { useCatalogRangeQuery } from '../hooks/useCatalog'
import { getApiErrorMessage } from '../api/client'
import { ESTADO_DISPONIBILIDAD_LABEL, ESTADO_DISPONIBILIDAD_TONE, formatDate, todayIsoDate } from '../utils/estado'
import type { EstadoDisponibilidad, RoutePoint } from '../types'

export function AdminCatalogPage() {
  const [fechaDesde, setFechaDesde] = useState(todayIsoDate())
  const [fechaHasta, setFechaHasta] = useState(todayIsoDate())
  const [estadoDisponibilidad, setEstadoDisponibilidad] = useState<EstadoDisponibilidad | ''>('')
  const [sectorFilter, setSectorFilter] = useState('')
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<RoutePoint | null>(null)
  const [reprogrammingPoint, setReprogrammingPoint] = useState<RoutePoint | null>(null)
  const [isImportOpen, setIsImportOpen] = useState(false)

  const rangoInvalido = fechaDesde > fechaHasta
  const catalogQuery = useCatalogRangeQuery(
    rangoInvalido
      ? { fechaDesde: '', fechaHasta: '' }
      : { fechaDesde, fechaHasta, estadoDisponibilidad: estadoDisponibilidad || undefined },
  )

  const filteredPoints = useMemo(() => {
    const term = sectorFilter.trim().toLowerCase()
    if (!term) return catalogQuery.data ?? []
    return (catalogQuery.data ?? []).filter((point) => point.sector.toLowerCase().includes(term))
  }, [catalogQuery.data, sectorFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Catálogo de puntos</h1>
          <p className="mt-0.5 text-sm text-slate-500">Crea y edita los puntos de inspección disponibles para cada fecha.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsImportOpen(true)}>
            Importar Excel/CSV
          </Button>
          <Button onClick={() => setIsCreateOpen(true)}>Nuevo punto</Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
        <div className="w-full sm:w-48">
          <Input label="Desde" type="date" value={fechaDesde} onChange={(event) => setFechaDesde(event.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Input label="Hasta" type="date" value={fechaHasta} onChange={(event) => setFechaHasta(event.target.value)} />
        </div>
        <div className="w-full sm:w-56">
          <Select
            label="Disponibilidad"
            value={estadoDisponibilidad}
            onChange={(event) => setEstadoDisponibilidad(event.target.value as EstadoDisponibilidad | '')}
          >
            <option value="">Todos</option>
            <option value="disponible">Disponible</option>
            <option value="tomado">Tomado</option>
          </Select>
        </div>
        <div className="w-full sm:w-56">
          <Input
            label="Buscar por sector"
            placeholder="Ej: UV-A1"
            value={sectorFilter}
            onChange={(event) => setSectorFilter(event.target.value)}
          />
        </div>
      </div>

      {rangoInvalido ? (
        <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          La fecha "Desde" no puede ser posterior a la fecha "Hasta".
        </p>
      ) : null}

      {rangoInvalido ? null : catalogQuery.isPending ? (
        <Spinner />
      ) : catalogQuery.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(catalogQuery.error)}</p>
      ) : filteredPoints.length === 0 ? (
        <EmptyState
          title="No hay puntos para estos filtros"
          description={
            sectorFilter
              ? `Ningún punto coincide con "${sectorFilter}" en el rango seleccionado.`
              : 'Crea un nuevo punto de inspección para comenzar.'
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1320px] divide-y divide-slate-100 text-sm">
              <thead className="bg-slate-50 text-left text-xs font-medium uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3">Fecha / Día</th>
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
                {filteredPoints.map((point) => (
                  <tr key={point.id} className="hover:bg-slate-50/60">
                    <td className="px-4 py-3 text-slate-600">
                      <p className="font-medium text-slate-800">{formatDate(point.fecha)}</p>
                      <p className="text-xs text-slate-500">{point.diaProgramado}</p>
                    </td>
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
                      <div className="flex justify-end gap-2">
                        <Button variant="primary" size="sm" onClick={() => setReprogrammingPoint(point)}>
                          Reprogramar
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setEditingPoint(point)}>
                          Editar
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <CreateRoutePointModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} fecha={todayIsoDate()} />
      <EditRoutePointModal isOpen={Boolean(editingPoint)} onClose={() => setEditingPoint(null)} point={editingPoint} />
      <ReprogramarPuntoModal
        isOpen={Boolean(reprogrammingPoint)}
        onClose={() => setReprogrammingPoint(null)}
        point={reprogrammingPoint}
      />
      <ImportCatalogModal isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} />
    </div>
  )
}
