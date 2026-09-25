import { useState } from 'react'
import { Modal } from './ui/Modal'
import { Button } from './ui/Button'
import { useImportCatalog } from '../hooks/useCatalog'
import { getApiErrorMessage } from '../api/client'
import { todayIsoDate } from '../utils/estado'

type ImportCatalogModalProps = {
  isOpen: boolean
  onClose: () => void
}

const TEMPLATE_HEADERS = [
  'fecha',
  'diaProgramado',
  'sector',
  'direccion',
  'empresaResponsable',
  'tipoExigencia',
  'descripcionExigencia',
  'ventanaEntrada',
  'ventanaSalida',
  'vigenciaDesde',
  'vigenciaHasta',
  'inspectorAsignado',
]

function downloadTemplate() {
  const hoy = todayIsoDate()
  const ejemplo = [hoy, 'Lunes', 'UV-A1', 'Av. Siempre Viva 123', 'Empresa Ejemplo SPA', 'ETO', 'Instalación eléctrica', '09:00', '18:00', hoy, hoy, '']
  const csv = [TEMPLATE_HEADERS.join(','), ejemplo.join(',')].join('\n')
  const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', 'plantilla-catalogo.csv')
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

export function ImportCatalogModal({ isOpen, onClose }: ImportCatalogModalProps) {
  const importMutation = useImportCatalog()
  const [file, setFile] = useState<File | null>(null)

  const handleClose = () => {
    setFile(null)
    importMutation.reset()
    onClose()
  }

  const handleImport = () => {
    if (!file) return
    importMutation.mutate(file)
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Importar puntos desde Excel/CSV"
      footer={
        <>
          <Button variant="ghost" type="button" onClick={handleClose}>
            {importMutation.isSuccess ? 'Cerrar' : 'Cancelar'}
          </Button>
          <Button type="button" onClick={handleImport} isLoading={importMutation.isPending} disabled={!file}>
            Importar
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <div className="rounded-xl bg-slate-50 px-3.5 py-3 text-sm text-slate-600">
          <p className="font-medium text-slate-700">Formato esperado</p>
          <p className="mt-1">
            La primera fila debe traer estos encabezados (en cualquier orden):
          </p>
          <p className="mt-1.5 rounded-lg bg-white px-2.5 py-2 font-mono text-xs text-slate-600">
            {TEMPLATE_HEADERS.join(', ')}
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-500">
            <li>Fechas en formato AAAA-MM-DD y horarios en HH:MM.</li>
            <li>
              <span className="font-medium">inspectorAsignado</span> es opcional: escribe el username o el nombre completo del
              inspector, o déjalo vacío.
            </li>
            <li>
              <span className="font-medium">descripcionExigencia</span> también es opcional.
            </li>
            <li>Cada fila crea un punto nuevo — si subes el mismo archivo dos veces, se duplican.</li>
          </ul>
          <button type="button" onClick={downloadTemplate} className="mt-3 text-sm font-medium text-primary-700 hover:underline">
            Descargar plantilla CSV de ejemplo
          </button>
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Archivo (.csv o .xlsx)</label>
          <input
            type="file"
            accept=".csv,.xlsx"
            onChange={(event) => {
              setFile(event.target.files?.[0] ?? null)
              importMutation.reset()
            }}
            className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-primary-50 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary-700 hover:file:bg-primary-100"
          />
        </div>

        {importMutation.isError ? (
          <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{getApiErrorMessage(importMutation.error)}</p>
        ) : null}

        {importMutation.isSuccess ? (
          <div className="flex flex-col gap-2">
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {importMutation.data.insertedCount} punto{importMutation.data.insertedCount === 1 ? '' : 's'} importado
              {importMutation.data.insertedCount === 1 ? '' : 's'} correctamente.
            </p>
            {importMutation.data.errors.length > 0 ? (
              <div className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
                <p className="font-medium">{importMutation.data.errors.length} fila(s) con errores (no se importaron):</p>
                <ul className="mt-1 max-h-40 space-y-1 overflow-y-auto text-xs">
                  {importMutation.data.errors.map((err) => (
                    <li key={err.row}>
                      Fila {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </Modal>
  )
}
