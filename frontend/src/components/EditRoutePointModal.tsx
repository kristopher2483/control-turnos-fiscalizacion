import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { TextArea } from './ui/TextArea'
import { useUpdateRoutePoint } from '../hooks/useCatalog'
import { useInspectorsQuery } from '../hooks/useUsers'
import { getApiErrorMessage } from '../api/client'
import { DIAS_SEMANA } from '../utils/dias'
import { ESTADO_DISPONIBILIDAD_LABEL } from '../utils/estado'
import type { RoutePoint } from '../types'

const editPointSchema = z
  .object({
    diaProgramado: z.string().min(1, 'Selecciona un día'),
    sector: z.string().min(1, 'Ingresa el sector'),
    direccion: z.string().min(1, 'Ingresa la dirección'),
    empresaResponsable: z.string().min(1, 'Ingresa la empresa responsable'),
    tipoExigencia: z.string().min(1, 'Ingresa el tipo de exigencia'),
    descripcionExigencia: z.string().optional(),
    ventanaEntrada: z.string().min(1, 'Ingresa la hora de entrada'),
    ventanaSalida: z.string().min(1, 'Ingresa la hora de salida'),
    vigenciaDesde: z.string().min(1, 'Ingresa el inicio de vigencia de la ETO'),
    vigenciaHasta: z.string().min(1, 'Ingresa el término de vigencia de la ETO'),
    assignedInspectorId: z.string().optional(),
    estadoDisponibilidad: z.enum(['disponible', 'tomado']),
  })
  .refine((data) => data.vigenciaHasta >= data.vigenciaDesde, {
    message: 'La vigencia hasta no puede ser anterior a la vigencia desde',
    path: ['vigenciaHasta'],
  })

type EditPointFormValues = z.infer<typeof editPointSchema>

type EditRoutePointModalProps = {
  isOpen: boolean
  onClose: () => void
  point: RoutePoint | null
}

export function EditRoutePointModal({ isOpen, onClose, point }: EditRoutePointModalProps) {
  const updateMutation = useUpdateRoutePoint()
  const inspectorsQuery = useInspectorsQuery()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<EditPointFormValues>({
    resolver: zodResolver(editPointSchema),
    defaultValues: {
      diaProgramado: '',
      sector: '',
      direccion: '',
      empresaResponsable: '',
      tipoExigencia: '',
      descripcionExigencia: '',
      ventanaEntrada: '',
      ventanaSalida: '',
      vigenciaDesde: '',
      vigenciaHasta: '',
      assignedInspectorId: '',
      estadoDisponibilidad: 'disponible',
    },
  })

  useEffect(() => {
    if (point) {
      reset({
        diaProgramado: point.diaProgramado,
        sector: point.sector,
        direccion: point.direccion,
        empresaResponsable: point.empresaResponsable,
        tipoExigencia: point.tipoExigencia,
        descripcionExigencia: point.descripcionExigencia,
        ventanaEntrada: point.ventanaEntrada,
        ventanaSalida: point.ventanaSalida,
        vigenciaDesde: point.vigenciaDesde,
        vigenciaHasta: point.vigenciaHasta,
        assignedInspectorId: point.assignedInspectorId ?? '',
        estadoDisponibilidad: point.estadoDisponibilidad,
      })
      updateMutation.reset()
    }
  }, [point])

  if (!point) return null

  const onSubmit = handleSubmit((values) => {
    updateMutation.mutate(
      { id: point.id, input: { ...values, assignedInspectorId: values.assignedInspectorId || null } },
      { onSuccess: onClose },
    )
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Editar punto · ${point.sector}`}
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="edit-point-form" isLoading={updateMutation.isPending}>
            Guardar cambios
          </Button>
        </>
      }
    >
      <form id="edit-point-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Select label="Día programado" error={errors.diaProgramado?.message} {...register('diaProgramado')}>
            {DIAS_SEMANA.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
              </option>
            ))}
          </Select>
          <Select label="Disponibilidad" error={errors.estadoDisponibilidad?.message} {...register('estadoDisponibilidad')}>
            {(Object.keys(ESTADO_DISPONIBILIDAD_LABEL) as Array<keyof typeof ESTADO_DISPONIBILIDAD_LABEL>).map((estado) => (
              <option key={estado} value={estado}>
                {ESTADO_DISPONIBILIDAD_LABEL[estado]}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Sector" error={errors.sector?.message} {...register('sector')} />
          <Input label="Dirección" error={errors.direccion?.message} {...register('direccion')} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Empresa responsable" error={errors.empresaResponsable?.message} {...register('empresaResponsable')} />
          <Input label="Tipo de exigencia" error={errors.tipoExigencia?.message} {...register('tipoExigencia')} />
        </div>

        <TextArea
          label="Descripción de la exigencia"
          error={errors.descripcionExigencia?.message}
          {...register('descripcionExigencia')}
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Ventana de entrada" type="time" error={errors.ventanaEntrada?.message} {...register('ventanaEntrada')} />
          <Input label="Ventana de salida" type="time" error={errors.ventanaSalida?.message} {...register('ventanaSalida')} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input
            label="Vigencia ETO desde"
            type="date"
            error={errors.vigenciaDesde?.message}
            {...register('vigenciaDesde')}
          />
          <Input
            label="Vigencia ETO hasta"
            type="date"
            error={errors.vigenciaHasta?.message}
            {...register('vigenciaHasta')}
          />
        </div>

        <Select
          label="Inspector asignado"
          error={errors.assignedInspectorId?.message}
          {...register('assignedInspectorId')}
        >
          <option value="">Sin asignar</option>
          {(inspectorsQuery.data ?? []).map((inspector) => (
            <option key={inspector.id} value={inspector.id}>
              {inspector.fullName}
            </option>
          ))}
        </Select>

        {updateMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error)}</p>
        ) : null}
      </form>
    </Modal>
  )
}
