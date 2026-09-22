import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Select } from './ui/Select'
import { TextArea } from './ui/TextArea'
import { Input } from './ui/Input'
import type { DailyRouteAssignment } from '../types'
import { ESTADO_ASIGNACION_LABEL, ESTADO_ASIGNACION_OPTIONS, ESTADOS_LIBERABLES, formatDateTime } from '../utils/estado'
import { useReleaseAssignment, useUpdateAssignment } from '../hooks/useDailyRoutes'
import { getApiErrorMessage } from '../api/client'

const updateSchema = z.object({
  estado: z.enum(['pendiente', 'en_progreso', 'fiscalizado', 'no_corresponde']),
  observaciones: z
    .string()
    .min(1, 'Las observaciones son obligatorias')
    .max(1000, 'Máximo 1000 caracteres'),
  horaLlegada: z.string().min(1, 'La hora de llegada es obligatoria'),
  horaSalida: z.string().min(1, 'La hora de salida es obligatoria'),
  nuevoComentario: z.string().max(500, 'Máximo 500 caracteres').optional(),
})

type UpdateFormValues = z.infer<typeof updateSchema>

type RouteUpdateModalProps = {
  isOpen: boolean
  onClose: () => void
  assignment: DailyRouteAssignment | null
}

export function RouteUpdateModal({ isOpen, onClose, assignment }: RouteUpdateModalProps) {
  const updateMutation = useUpdateAssignment()
  const releaseMutation = useReleaseAssignment()
  const [confirmingRelease, setConfirmingRelease] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { estado: 'pendiente', observaciones: '', horaLlegada: '', horaSalida: '', nuevoComentario: '' },
  })

  // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-run when the selected assignment changes,
  // not on every mutation state change (the mutation object's identity changes on every render in TanStack Query v5,
  // and calling updateMutation.reset() here would otherwise retrigger this effect forever).
  useEffect(() => {
    if (assignment) {
      reset({
        // 'liberado' isn't a selectable form value (see ESTADO_ASIGNACION_OPTIONS) — the field is
        // disabled in that case anyway, so this default is never actually submitted.
        estado: assignment.estado === 'liberado' ? 'pendiente' : assignment.estado,
        observaciones: assignment.observaciones ?? '',
        horaLlegada: assignment.horaLlegada ?? '',
        horaSalida: assignment.horaSalida ?? '',
        nuevoComentario: '',
      })
      updateMutation.reset()
      releaseMutation.reset()
      setConfirmingRelease(false)
    }
  }, [assignment?.id])

  if (!assignment) return null

  const isLiberado = assignment.estado === 'liberado'
  const isFiscalizado = assignment.estado === 'fiscalizado'
  const isReadOnly = isLiberado || isFiscalizado
  const puedeLiberar = ESTADOS_LIBERABLES.includes(assignment.estado)

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate(
      {
        id: assignment.id,
        input: {
          estado: values.estado,
          observaciones: values.observaciones ?? '',
          horaLlegada: values.horaLlegada || undefined,
          horaSalida: values.horaSalida || undefined,
          nuevaFiscalizacion: values.nuevoComentario?.trim() ? { comentario: values.nuevoComentario.trim() } : undefined,
        },
      },
      { onSuccess: onClose },
    )
  })

  const handleRelease = () => {
    releaseMutation.mutate(assignment.id, { onSuccess: onClose })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Actualizar visita · ${assignment.snapshot.sector}`}
      size="lg"
      footer={
        <div className="flex w-full flex-wrap items-center justify-between gap-3">
          <div>
            {puedeLiberar && !confirmingRelease ? (
              <Button
                variant="ghost"
                type="button"
                className="text-rose-600 hover:bg-rose-50"
                onClick={() => setConfirmingRelease(true)}
              >
                Liberar ruta
              </Button>
            ) : null}
            {puedeLiberar && confirmingRelease ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">¿Liberar para que otro inspector la tome?</span>
                <Button variant="ghost" type="button" onClick={() => setConfirmingRelease(false)}>
                  No
                </Button>
                <Button variant="danger" type="button" isLoading={releaseMutation.isPending} onClick={handleRelease}>
                  Sí, liberar
                </Button>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" form="route-update-form" isLoading={updateMutation.isPending} disabled={isReadOnly}>
              Guardar cambios
            </Button>
          </div>
        </div>
      }
    >
      <form id="route-update-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        {isLiberado ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            Esta ruta fue liberada y quedó disponible para que otro inspector la tome. Este registro es de solo lectura.
          </p>
        ) : null}
        {isFiscalizado ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            Esta ruta ya fue fiscalizada y queda cerrada: no puede editarse. Este registro es de solo lectura.
          </p>
        ) : null}
        <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-800">{assignment.snapshot.direccion}</p>
          <p>{assignment.snapshot.empresaResponsable} · {assignment.snapshot.tipoExigencia}</p>
          <p>
            Ventana: {assignment.snapshot.ventanaEntrada} – {assignment.snapshot.ventanaSalida}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Select label="Estado *" error={errors.estado?.message} disabled={isReadOnly} {...register('estado')}>
            {ESTADO_ASIGNACION_OPTIONS.map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_ASIGNACION_LABEL[estado]}
              </option>
            ))}
          </Select>
          <Input
            label="Hora de llegada *"
            type="time"
            error={errors.horaLlegada?.message}
            disabled={isReadOnly}
            {...register('horaLlegada')}
          />
          <Input
            label="Hora de salida *"
            type="time"
            error={errors.horaSalida?.message}
            disabled={isReadOnly}
            {...register('horaSalida')}
          />
        </div>

        <TextArea
          label="Observaciones generales *"
          placeholder="Notas relevantes sobre esta visita…"
          error={errors.observaciones?.message}
          disabled={isReadOnly}
          {...register('observaciones')}
        />

        <div>
          <p className="mb-1.5 text-sm font-medium text-slate-700">Historial de fiscalizaciones</p>
          <p className="mb-2 text-xs text-slate-500">
            Este historial es de solo lectura: cada fiscalización queda registrada de forma permanente y no puede editarse ni
            eliminarse.
          </p>
          {assignment.fiscalizaciones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-400">
              Todavía no hay fiscalizaciones registradas para este punto.
            </p>
          ) : (
            <ol className="max-h-40 space-y-2 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {assignment.fiscalizaciones.map((f) => (
                <li key={f.numero} className="text-sm">
                  <span className="font-medium text-slate-700">
                    Fiscalización #{f.numero} · {formatDateTime(f.horaRegistro)}
                  </span>
                  <p className="text-slate-600">{f.comentario}</p>
                </li>
              ))}
            </ol>
          )}
        </div>

        <TextArea
          label="Agregar nueva fiscalización (opcional)"
          placeholder="Describe lo observado en esta nueva visita…"
          error={errors.nuevoComentario?.message}
          hint="Se agregará como un nuevo registro al historial, sin modificar los anteriores."
          disabled={isReadOnly}
          {...register('nuevoComentario')}
        />

        {updateMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error)}</p>
        ) : null}
        {releaseMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(releaseMutation.error)}</p>
        ) : null}
      </form>
    </Modal>
  )
}
