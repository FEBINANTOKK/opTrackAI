import type { ReactNode } from 'react'

type BadgeTone = 'blue' | 'yellow' | 'slate' | 'green'

const toneClass: Record<BadgeTone, string> = {
  blue: 'border-blue-200 bg-blue-50 text-[#1257d6]',
  yellow: 'border-yellow-200 bg-yellow-50 text-yellow-800',
  slate: 'border-slate-200 bg-slate-100 text-slate-700',
  green: 'border-emerald-200 bg-emerald-50 text-emerald-800',
}

type BadgeProps = {
  children: ReactNode
  tone?: BadgeTone
  className?: string
}

export function Badge({ children, tone = 'slate', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-black ${toneClass[tone]} ${className}`}
    >
      {children}
    </span>
  )
}
