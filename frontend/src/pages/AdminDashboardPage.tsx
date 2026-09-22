import { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { StatCard } from '../components/ui/StatCard'
import { Spinner } from '../components/ui/Spinner'
import { Badge } from '../components/ui/Badge'
import { useSummaryQuery } from '../hooks/useReports'
import { ESTADO_ASIGNACION_LABEL, ESTADO_ASIGNACION_TONE, todayIsoDate } from '../utils/estado'
import { ESTADO_CHART_COLOR, SECTOR_BAR_COLOR } from '../utils/chartColors'
import { getApiErrorMessage } from '../api/client'
import type { EstadoAsignacion } from '../types'

export function AdminDashboardPage() {
  const today = todayIsoDate()
  const [desde, setDesde] = useState(today)
  const [hasta, setHasta] = useState(today)

  const summaryQuery = useSummaryQuery({ desde, hasta })
  const summary = summaryQuery.data

  const estadoData = useMemo(() => {
    if (!summary) return []
    return Object.entries(summary.porEstado).map(([estado, total]) => ({
      estado: estado as EstadoAsignacion,
      label: ESTADO_ASIGNACION_LABEL[estado as EstadoAsignacion] ?? estado,
      total,
    }))
  }, [summary])

  const sectorData = useMemo(() => {
    if (!summary) return []
    return Object.entries(summary.porSector)
      .map(([sector, total]) => ({ sector, total }))
      .sort((a, b) => b.total - a.total)
  }, [summary])

  const completados = summary?.porEstado.fiscalizado ?? 0
  const pendientes = summary?.porEstado.pendiente ?? 0
  const inspectoresActivos = summary ? Object.keys(summary.porInspector).length : 0

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Panel de control</h1>
          <p className="mt-0.5 text-sm text-slate-500">Resumen de la fiscalización en el período seleccionado.</p>
        </div>
        <div className="flex gap-3">
          <Input label="Desde" type="date" value={desde} onChange={(event) => setDesde(event.target.value)} />
          <Input label="Hasta" type="date" value={hasta} onChange={(event) => setHasta(event.target.value)} />
        </div>
      </div>

      {summaryQuery.isError ? (
        <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(summaryQuery.error)}</p>
      ) : null}

      {summaryQuery.isPending ? (
        <Spinner />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              label="Total puntos"
              value={summary?.totalPuntos ?? 0}
              tone="primary"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              }
            />
            <StatCard
              label="Completados"
              value={completados}
              tone="green"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              }
            />
            <StatCard
              label="Pendientes"
              value={pendientes}
              tone="amber"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
            />
            <StatCard
              label="Inspectores activos"
              value={inspectoresActivos}
              tone="slate"
              icon={
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              }
            />
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Puntos por estado" subtitle="Distribución de las visitas según su estado actual" />
              <CardBody>
                {estadoData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No hay datos para el período seleccionado.</p>
                ) : (
                  <>
                    <ResponsiveContainer width="100%" height={260}>
                      <BarChart data={estadoData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" vertical={false} />
                        <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#898781' }} axisLine={{ stroke: '#c3c2b7' }} tickLine={false} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          cursor={{ fill: '#f9f9f7' }}
                          contentStyle={{ borderRadius: 12, border: '1px solid #e1e0d9', fontSize: 13 }}
                        />
                        <Bar dataKey="total" radius={[6, 6, 0, 0]} maxBarSize={56}>
                          {estadoData.map((entry) => (
                            <Cell key={entry.estado} fill={ESTADO_CHART_COLOR[entry.estado]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {estadoData.map((entry) => (
                        <Badge key={entry.estado} tone={ESTADO_ASIGNACION_TONE[entry.estado]} dot>
                          {entry.label}: {entry.total}
                        </Badge>
                      ))}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Puntos por sector" subtitle="Cantidad de puntos fiscalizados por sector" />
              <CardBody>
                {sectorData.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">No hay datos para el período seleccionado.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={sectorData} layout="vertical" margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e1e0d9" horizontal={false} />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#898781' }} axisLine={false} tickLine={false} />
                      <YAxis
                        type="category"
                        dataKey="sector"
                        width={110}
                        tick={{ fontSize: 12, fill: '#52514e' }}
                        axisLine={{ stroke: '#c3c2b7' }}
                        tickLine={false}
                      />
                      <Tooltip cursor={{ fill: '#f9f9f7' }} contentStyle={{ borderRadius: 12, border: '1px solid #e1e0d9', fontSize: 13 }} />
                      <Bar dataKey="total" fill={SECTOR_BAR_COLOR} radius={[0, 6, 6, 0]} maxBarSize={22} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardBody>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
