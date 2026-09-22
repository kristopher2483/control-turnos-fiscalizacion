import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Select } from './ui/Select'
import { TextArea } from './ui/TextArea'
import { useCreateRoutePoint } from '../hooks/useCatalog'
import { useInspectorsQuery } from '../hooks/useUsers'
import { getApiErrorMessage } from '../api/client'
import { DIAS_SEMANA } from '../utils/dias'

const createPointSchema = z
  .object({
    fecha: z.string().min(1, 'Selecciona una fecha'),
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
  })
  .refine((data) => data.vigenciaHasta >= data.vigenciaDesde, {
    message: 'La vigencia hasta no puede ser anterior a la vigencia desde',
    path: ['vigenciaHasta'],
  })

type CreatePointFormValues = z.infer<typeof createPointSchema>

type CreateRoutePointModalProps = {
  isOpen: boolean
  onClose: () => void
  fecha: string
}

export function CreateRoutePointModal({ isOpen, onClose, fecha }: CreateRoutePointModalProps) {
  const createMutation = useCreateRoutePoint()
  const inspectorsQuery = useInspectorsQuery()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePointFormValues>({
    resolver: zodResolver(createPointSchema),
    defaultValues: {
      fecha,
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
    },
  })

  useEffect(() => {
    if (isOpen) {
      reset({
        fecha,
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
      })
      createMutation.reset()
    }
  }, [isOpen, fecha])

  const onSubmit = handleSubmit((values: CreatePointFormValues) => {
    createMutation.mutate(
      {
        fecha: values.fecha,
        diaProgramado: values.diaProgramado,
        sector: values.sector,
        direccion: values.direccion,
        empresaResponsable: values.empresaResponsable,
        tipoExigencia: values.tipoExigencia,
        descripcionExigencia: values.descripcionExigencia ?? '',
        ventanaEntrada: values.ventanaEntrada,
        ventanaSalida: values.ventanaSalida,
        vigenciaDesde: values.vigenciaDesde,
        vigenciaHasta: values.vigenciaHasta,
        assignedInspectorId: values.assignedInspectorId || null,
      },
      { onSuccess: onClose },
    )
  })

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Nuevo punto de inspección"
      size="lg"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="create-point-form" isLoading={createMutation.isPending}>
            Crear punto
          </Button>
        </>
      }
    >
      <form id="create-point-form" onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Input label="Fecha" type="date" error={errors.fecha?.message} {...register('fecha')} />
          <Select label="Día programado" placeholder="Selecciona un día" error={errors.diaProgramado?.message} {...register('diaProgramado')}>
            {DIAS_SEMANA.map((dia) => (
              <option key={dia} value={dia}>
                {dia}
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
          label="Inspector asignado (opcional)"
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

        {createMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(createMutation.error)}</p>
        ) : null}
      </form>
    </Modal>
  )
}
