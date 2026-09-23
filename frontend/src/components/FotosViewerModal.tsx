import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import type { DailyRouteAssignment } from '../types'
import { formatDateTime } from '../utils/estado'

type FotosViewerModalProps = {
  isOpen: boolean
  onClose: () => void
  assignment: DailyRouteAssignment | null
}

export function FotosViewerModal({ isOpen, onClose, assignment }: FotosViewerModalProps) {
  if (!assignment) return null

  const fiscalizacionesConFotos = assignment.fiscalizaciones.filter((f) => f.fotos.length > 0)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Fotos · ${assignment.snapshot.sector} (${assignment.inspectorUsername})`}
      size="lg"
      footer={
        <Button variant="ghost" type="button" onClick={onClose}>
          Cerrar
        </Button>
      }
    >
      {fiscalizacionesConFotos.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-sm text-slate-400">
          Este registro no tiene fotos adjuntas.
        </p>
      ) : (
        <div className="flex flex-col gap-4">
          {fiscalizacionesConFotos.map((f) => (
            <div key={f.numero}>
              <p className="mb-1.5 text-sm font-medium text-slate-700">
                Fiscalización #{f.numero} · {formatDateTime(f.horaRegistro)}
              </p>
              <p className="mb-2 text-sm text-slate-500">{f.comentario}</p>
              <div className="flex flex-wrap gap-2">
                {f.fotos.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block h-24 w-24 overflow-hidden rounded-lg border border-slate-200"
                    title="Ver foto en tamaño completo"
                  >
                    <img src={url} alt={`Foto ${index + 1} de la fiscalización #${f.numero}`} className="h-full w-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}
