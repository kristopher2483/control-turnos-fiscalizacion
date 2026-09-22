import type { TextareaHTMLAttributes } from 'react'
import { forwardRef, useId } from 'react'

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, error, hint, id, className = '', rows = 3, ...rest },
  ref,
) {
  const generatedId = useId()
  const textAreaId = id ?? generatedId

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={textAreaId} className="mb-1.5 block text-sm font-medium text-slate-700">
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={textAreaId}
        rows={rows}
        className={`w-full resize-none rounded-xl border bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500/40 disabled:bg-slate-50 disabled:text-slate-400 ${
          error ? 'border-rose-400 focus:ring-rose-400/40' : 'border-slate-300 focus:border-primary-500'
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...rest}
      />
      {hint && !error ? <p className="mt-1 text-xs text-slate-500">{hint}</p> : null}
      {error ? <p className="mt-1 text-xs text-rose-600">{error}</p> : null}
    </div>
  )
})
