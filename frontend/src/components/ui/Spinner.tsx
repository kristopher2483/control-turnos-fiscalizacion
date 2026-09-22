type SpinnerProps = {
  className?: string
  label?: string
}

export function Spinner({ className = 'h-6 w-6 text-primary-600', label = 'Cargando…' }: SpinnerProps) {
  return (
    <div className="flex items-center justify-center gap-2 py-8 text-slate-500">
      <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
      </svg>
      <span className="text-sm">{label}</span>
    </div>
  )
}
