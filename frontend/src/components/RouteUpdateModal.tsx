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
import {
  useDeleteFiscalizacionFoto,
  useReleaseAssignment,
  useUpdateAssignment,
  useUploadFiscalizacionFotos,
} from '../hooks/useDailyRoutes'
import { getApiErrorMessage } from '../api/client'
import { compressImage } from '../utils/image'

const MAX_FOTOS = 3
const MAX_RAW_INPUT_BYTES = 20 * 1024 * 1024
const MAX_FOTO_SIZE_BYTES = 5 * 1024 * 1024
const ALLOWED_FOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp'])

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
  const uploadFotosMutation = useUploadFiscalizacionFotos()
  const deleteFotoMutation = useDeleteFiscalizacionFoto()
  const [confirmingRelease, setConfirmingRelease] = useState(false)
  const [selectedFotos, setSelectedFotos] = useState<File[]>([])
  const [fotosError, setFotosError] = useState<string | null>(null)
  const [isCompressing, setIsCompressing] = useState(false)
  // Mirrors the `assignment` prop but can be refreshed locally right after deleting a photo, so the
  // historial list reflects the removal immediately without closing the modal.
  const [displayAssignment, setDisplayAssignment] = useState(assignment)

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
      uploadFotosMutation.reset()
      deleteFotoMutation.reset()
      setConfirmingRelease(false)
      setSelectedFotos([])
      setFotosError(null)
      setIsCompressing(false)
      setDisplayAssignment(assignment)
    }
  }, [assignment?.id])

  // Object URLs for the local thumbnail previews — revoked whenever the selection changes or the
  // modal unmounts, so we don't leak memory across many open/close cycles in one session.
  const [previewUrls, setPreviewUrls] = useState<string[]>([])
  useEffect(() => {
    const urls = selectedFotos.map((file) => URL.createObjectURL(file))
    setPreviewUrls(urls)
    return () => urls.forEach((url) => URL.revokeObjectURL(url))
  }, [selectedFotos])

  if (!assignment) return null

  // `displayAssignment` is only synced to a newly-opened `assignment` via an effect, which runs one
  // render after the prop changes — fall back to `assignment` itself until then, so the very first
  // render after opening a different record never reads off a stale/mismatched (or still-null) value.
  const historyAssignment = displayAssignment && displayAssignment.id === assignment.id ? displayAssignment : assignment

  const isLiberado = assignment.estado === 'liberado'
  const isFiscalizado = assignment.estado === 'fiscalizado'
  const isReadOnly = isLiberado || isFiscalizado
  const puedeLiberar = ESTADOS_LIBERABLES.includes(assignment.estado)

  const handleFotosChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    if (files.length === 0) return

    if (selectedFotos.length + files.length > MAX_FOTOS) {
      setFotosError(`Puedes adjuntar como máximo ${MAX_FOTOS} fotos por fiscalización.`)
      return
    }
    const invalid = files.find((file) => !ALLOWED_FOTO_TYPES.has(file.type) || file.size > MAX_RAW_INPUT_BYTES)
    if (invalid) {
      setFotosError('Cada foto debe ser JPG, PNG o WEBP y pesar como máximo 20MB.')
      return
    }

    setFotosError(null)
    setIsCompressing(true)
    try {
      // Downscaled/re-encoded client-side before upload — a typical multi-MB phone photo shrinks
      // to a few hundred KB, which matters a lot given the free-tier Storage quota.
      const compressed = await Promise.all(files.map((file) => compressImage(file)))
      const tooLarge = compressed.find((file) => file.size > MAX_FOTO_SIZE_BYTES)
      if (tooLarge) {
        setFotosError('Una de las fotos sigue pesando más de 5MB incluso tras comprimirla. Intenta con otra foto.')
        return
      }
      setSelectedFotos((prev) => [...prev, ...compressed])
    } finally {
      setIsCompressing(false)
    }
  }

  const removeSelectedFoto = (index: number) => {
    setSelectedFotos((prev) => prev.filter((_, i) => i !== index))
  }

  const onSubmit = handleSubmit((values) => {
    const comentarioFiscalizacion = values.nuevoComentario?.trim()
      ? values.nuevoComentario.trim()
      : selectedFotos.length > 0
        ? 'Evidencia fotográfica adjunta.'
        : undefined

    updateMutation.mutate(
      {
        id: assignment.id,
        input: {
          estado: values.estado,
          observaciones: values.observaciones ?? '',
          horaLlegada: values.horaLlegada || undefined,
          horaSalida: values.horaSalida || undefined,
          nuevaFiscalizacion: comentarioFiscalizacion ? { comentario: comentarioFiscalizacion } : undefined,
        },
      },
      {
        onSuccess: async (updated) => {
          setDisplayAssignment(updated)
          if (selectedFotos.length === 0) {
            onClose()
            return
          }
          const nuevaFiscalizacion = updated.fiscalizaciones[updated.fiscalizaciones.length - 1]
          try {
            const withFotos = await uploadFotosMutation.mutateAsync({
              id: assignment.id,
              numero: nuevaFiscalizacion.numero,
              files: selectedFotos,
            })
            setDisplayAssignment(withFotos)
            onClose()
          } catch {
            // Keep the modal open: the fiscalización comment already saved, but the photos didn't
            // upload — the error banner below explains it, and the user can just try saving again.
          }
        },
      },
    )
  })

  const handleRelease = () => {
    releaseMutation.mutate(assignment.id, { onSuccess: onClose })
  }

  const handleDeleteFoto = (numero: number, index: number) => {
    if (!window.confirm('¿Eliminar esta foto? Esta acción no se puede deshacer.')) return
    deleteFotoMutation.mutate(
      { id: assignment.id, numero, index },
      { onSuccess: (updated) => setDisplayAssignment(updated) },
    )
  }

  const isSaving = updateMutation.isPending || uploadFotosMutation.isPending || isCompressing

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
              <Button variant="warning" type="button" onClick={() => setConfirmingRelease(true)}>
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
            <Button type="submit" form="route-update-form" isLoading={isSaving} disabled={isReadOnly}>
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
            El comentario y la hora de cada fiscalización quedan registrados de forma permanente y no pueden editarse.
            {!isReadOnly
              ? ' Mientras este registro siga pendiente o en progreso, puedes eliminar sus fotos si es necesario.'
              : ' Este registro está cerrado, así que tampoco se pueden eliminar sus fotos.'}
          </p>
          {historyAssignment.fiscalizaciones.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-300 px-3 py-3 text-sm text-slate-400">
              Todavía no hay fiscalizaciones registradas para este punto.
            </p>
          ) : (
            <ol className="max-h-56 space-y-3 overflow-y-auto rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
              {historyAssignment.fiscalizaciones.map((f) => (
                <li key={f.numero} className="text-sm">
                  <span className="font-medium text-slate-700">
                    Fiscalización #{f.numero} · {formatDateTime(f.horaRegistro)}
                  </span>
                  <p className="text-slate-600">{f.comentario}</p>
                  {f.fotos.length > 0 ? (
                    <div className="mt-1.5 flex flex-wrap gap-2">
                      {f.fotos.map((url, index) => (
                        <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                          <a href={url} target="_blank" rel="noreferrer" className="block h-full w-full" title="Ver foto en tamaño completo">
                            <img
                              src={url}
                              alt={`Foto ${index + 1} de la fiscalización #${f.numero}`}
                              className="h-full w-full object-cover"
                            />
                          </a>
                          {!isReadOnly ? (
                            <button
                              type="button"
                              onClick={() => handleDeleteFoto(f.numero, index)}
                              disabled={deleteFotoMutation.isPending}
                              aria-label={`Eliminar foto ${index + 1} de la fiscalización #${f.numero}`}
                              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/70 text-[10px] leading-none text-white hover:bg-slate-900 disabled:opacity-50"
                            >
                              ×
                            </button>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
          {deleteFotoMutation.isError ? (
            <p className="mt-2 text-xs text-rose-600">{getApiErrorMessage(deleteFotoMutation.error)}</p>
          ) : null}
        </div>

        <TextArea
          label="Agregar nueva fiscalización (opcional)"
          placeholder="Describe lo observado en esta nueva visita…"
          error={errors.nuevoComentario?.message}
          hint="Se agregará como un nuevo registro al historial, sin modificar los anteriores."
          disabled={isReadOnly}
          {...register('nuevoComentario')}
        />

        {!isReadOnly ? (
          <div>
            <label className="mb-1.5 block text-sm font-medium text-slate-700">Fotos de evidencia (opcional)</label>
            <p className="mb-2 text-xs text-slate-500">
              Hasta {MAX_FOTOS} fotos (JPG, PNG o WEBP). Se comprimen automáticamente antes de subirse. Se agregan como una
              nueva fiscalización al historial; si no escribes un comentario arriba, se guardan igual con uno genérico.
            </p>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleFotosChange}
              disabled={selectedFotos.length >= MAX_FOTOS || isCompressing}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
            />
            {isCompressing ? <p className="mt-1 text-xs text-slate-500">Comprimiendo foto(s)…</p> : null}
            {fotosError ? <p className="mt-1 text-xs text-rose-600">{fotosError}</p> : null}
            {selectedFotos.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {selectedFotos.map((file, index) => (
                  <div key={index} className="relative h-16 w-16 overflow-hidden rounded-lg border border-slate-200">
                    <img src={previewUrls[index]} alt={file.name} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeSelectedFoto(index)}
                      aria-label={`Quitar ${file.name}`}
                      className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-slate-900/70 text-[10px] leading-none text-white hover:bg-slate-900"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {updateMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error)}</p>
        ) : null}
        {releaseMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(releaseMutation.error)}</p>
        ) : null}
        {uploadFotosMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">
            La fiscalización se guardó, pero las fotos no se pudieron subir: {getApiErrorMessage(uploadFotosMutation.error)}.
            Intenta guardar de nuevo.
          </p>
        ) : null}
      </form>
    </Modal>
  )
}
