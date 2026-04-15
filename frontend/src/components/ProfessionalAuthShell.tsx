import type { ReactNode } from 'react'

type ProfessionalAuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function ProfessionalAuthShell({ title, subtitle, children }: ProfessionalAuthShellProps) {
  return (
    <main className="auth-page flex min-h-screen items-center justify-center bg-[#f3f6fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <section className="auth-fade-in w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl shadow-slate-300/40 sm:p-8">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#1257d6] to-blue-600 text-xs font-black text-white shadow-lg shadow-blue-200">
              OT
            </div>
            <div>
              <p className="text-sm font-black text-[#1257d6]">Optrack AI</p>
              <p className="text-xs font-bold text-slate-400">Opportunity intelligence</p>
            </div>
          </div>
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black text-[#1257d6]">AI</span>
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-black tracking-[-0.03em] text-slate-800">{title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-500">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  )
}
