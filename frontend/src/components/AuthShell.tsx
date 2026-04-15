import type { ReactNode } from 'react'

type AuthShellProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <main className="min-h-screen bg-[#eef2f6] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl items-center">
        <section className="grid w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl shadow-slate-300/40 lg:grid-cols-[1fr_0.9fr]">
          <div className="relative min-h-[420px] bg-slate-950 p-8 text-white sm:p-10">
            <div className="flex h-full flex-col justify-between gap-10">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-emerald-300">
                  opTrackAI
                </p>
                <h1 className="mt-5 max-w-xl text-4xl font-bold leading-tight sm:text-5xl">
                  Opportunity recommendations built around your profile.
                </h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-slate-300">
                  Create your profile, share your preferences, and get a focused dashboard for hackathons,
                  internships, and roles that match how you want to work.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                {[
                  ['96%', 'Match score'],
                  ['Remote', 'Work mode'],
                  ['1 week', 'Time fit'],
                ].map(([value, label]) => (
                  <div className="rounded-lg border border-white/10 bg-white/10 p-4" key={label}>
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-300">
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-white/10 bg-white p-4 text-slate-950">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-emerald-700">
                      Recommended
                    </p>
                    <h2 className="mt-2 text-lg font-bold">AI Builder Sprint 2026</h2>
                    <p className="mt-1 text-sm text-slate-600">Hackathon · Remote · Cash prize</p>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-800">
                    Top
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center p-6 sm:p-8 lg:p-10">
            <div className="mx-auto w-full max-w-md">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-950">{title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{subtitle}</p>
            </div>
            {children}
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
