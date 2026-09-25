import { useEffect, useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useReprogramAssignment } from '../hooks/useDailyRoutes'
import { getApiErrorMessage } from '../api/client'
import { todayIsoDate } from '../utils/estado'
import type { DailyRouteAssignment } from '../types'

type ReprogramarModalProps = {
  isOpen: boolean
  onClose: () => void
  assignment: DailyRouteAssignment | null
}

export function ReprogramarModal({ isOpen, onClose, assignment }: ReprogramarModalProps) {
  const reprogramMutation = useReprogramAssignment()
  const [nuevaFecha, setNuevaFecha] = useState(todayIsoDate())

  useEffect(() => {
    if (assignment) {
      setNuevaFecha(todayIsoDate())
      reprogramMutation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the target assignment changes
  }, [assignment?.id])

  if (!assignment) return null

  const onSubmit = () => {
    reprogramMutation.mutate({ id: assignment.id, fecha: nuevaFecha }, { onSuccess: onClose })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reprogramar visita · ${assignment.snapshot.sector}`}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" isLoading={reprogramMutation.isPending} onClick={onSubmit}>
            Reprogramar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Este registro pasará a la nueva fecha con estado <span className="font-medium">Pendiente</span>, y el inspector{' '}
          <span className="font-medium">{assignment.inspectorUsername}</span> lo verá en "Mi ruta" al seleccionar ese día. El
          historial de observaciones y fiscalizaciones ya registrado se conserva.
        </p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Fecha actual: <span className="font-medium text-slate-700">{assignment.fecha}</span>
        </p>
        <Input label="Nueva fecha" type="date" value={nuevaFecha} onChange={(event) => setNuevaFecha(event.target.value)} />
        {reprogramMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(reprogramMutation.error)}</p>
        ) : null}
      </div>
    </Modal>
  )
}
