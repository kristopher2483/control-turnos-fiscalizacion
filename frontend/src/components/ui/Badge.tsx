import type { ReactNode } from 'react'

export type BadgeTone = 'amber' | 'blue' | 'green' | 'gray' | 'red' | 'indigo'

const toneClasses: Record<BadgeTone, string> = {
  amber: 'bg-amber-100 text-amber-800 ring-amber-600/20',
  blue: 'bg-blue-100 text-blue-800 ring-blue-600/20',
  green: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20',
  gray: 'bg-slate-100 text-slate-700 ring-slate-500/20',
  red: 'bg-rose-100 text-rose-800 ring-rose-600/20',
  indigo: 'bg-primary-100 text-primary-800 ring-primary-600/20',
}

type BadgeProps = {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'gray', children, className = '', dot }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${toneClasses[tone]} ${className}`}
    >
      {dot ? <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  )
}
