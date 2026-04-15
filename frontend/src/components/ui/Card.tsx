import type { ReactNode } from 'react'

type CardProps = {
  children: ReactNode
  className?: string
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-6 shadow-md transition-all duration-200 hover:shadow-xl ${className}`}
    >
      {children}
    </div>
  )
}
