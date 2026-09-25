import { useEffect, useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useUpdateRoutePoint } from '../hooks/useCatalog'
import { getApiErrorMessage } from '../api/client'
import { formatDate } from '../utils/estado'
import type { RoutePoint } from '../types'

type ReprogramarPuntoModalProps = {
  isOpen: boolean
  onClose: () => void
  point: RoutePoint | null
}

export function ReprogramarPuntoModal({ isOpen, onClose, point }: ReprogramarPuntoModalProps) {
  const updateMutation = useUpdateRoutePoint()
  const [nuevaFecha, setNuevaFecha] = useState('')

  useEffect(() => {
    if (point) {
      setNuevaFecha(point.fecha)
      updateMutation.reset()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only reset when the target point changes
  }, [point?.id])

  if (!point) return null

  const onSubmit = () => {
    updateMutation.mutate({ id: point.id, input: { fecha: nuevaFecha } }, { onSuccess: onClose })
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Reprogramar punto · ${point.sector}`}
      footer={
        <>
          <Button variant="ghost" type="button" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="button" isLoading={updateMutation.isPending} onClick={onSubmit}>
            Reprogramar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <p className="text-sm text-slate-600">
          Cambia la fecha en la que este punto aparece en el catálogo. No afecta registros de fiscalización ya creados para la
          fecha actual.
        </p>
        <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
          Fecha actual: <span className="font-medium text-slate-700">{formatDate(point.fecha)}</span>
        </p>
        <Input label="Nueva fecha" type="date" value={nuevaFecha} onChange={(event) => setNuevaFecha(event.target.value)} />
        {updateMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(updateMutation.error)}</p>
        ) : null}
      </div>
    </Modal>
  )
}
