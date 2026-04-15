import type { ReactNode } from 'react'

type InsightBannerProps = {
  children: ReactNode
}

export function InsightBanner({ children }: InsightBannerProps) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm font-bold leading-6 text-slate-700">
      <div className="flex gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white text-[#1257d6] shadow-sm">
          ⚡
        </span>
        <p>{children}</p>
      </div>
    </div>
  )
}
