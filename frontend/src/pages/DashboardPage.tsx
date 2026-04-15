import { useMemo } from 'react'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { SkillChip } from '../components/ui/SkillChip'
import { StatCard } from '../components/ui/StatCard'
import { useAuthStore } from '../store/useAuthStore'
import type { OpportunityType } from '../types/auth'

type Opportunity = {
  id: string
  title: string
  type: OpportunityType
  location: string
  mode: string
  reward: string
  link: string
  skills: string[]
  deadline: string
  match: number
}

const opportunities: Opportunity[] = [
  {
    id: 'hack-ai-sprint',
    title: 'AI Builder Sprint 2026',
    type: 'hackathon',
    location: 'Remote',
    mode: 'Remote',
    reward: 'Cash prize + mentorship',
    link: 'https://example.com/ai-builder-sprint',
    skills: ['React', 'Python', 'AI'],
    deadline: 'Apr 28',
    match: 96,
  },
  {
    id: 'frontend-fellowship',
    title: 'Frontend Engineering Internship',
    type: 'internship',
    location: 'Bengaluru',
    mode: 'Hybrid',
    reward: 'Stipend + PPO chance',
    link: 'https://example.com/frontend-internship',
    skills: ['React', 'TypeScript', 'UI design'],
    deadline: 'May 4',
    match: 91,
  },
  {
    id: 'campus-cloud',
    title: 'Campus Cloud Innovation Challenge',
    type: 'hackathon',
    location: 'Delhi',
    mode: 'Onsite',
    reward: 'Certificate + hiring fast track',
    link: 'https://example.com/cloud-challenge',
    skills: ['Cloud', 'Node.js', 'APIs'],
    deadline: 'May 12',
    match: 88,
  },
  {
    id: 'junior-product-engineer',
    title: 'Junior Product Engineer',
    type: 'job',
    location: 'Remote',
    mode: 'Remote',
    reward: 'Full-time role',
    link: 'https://example.com/product-engineer',
    skills: ['React', 'TypeScript', 'Problem solving'],
    deadline: 'Rolling',
    match: 84,
  },
]

type DashboardPageProps = {
  onLogout: () => void
  onEditPreferences: () => void
}

export function DashboardPage({ onLogout, onEditPreferences }: DashboardPageProps) {
  const user = useAuthStore((state) => state.user)
  const preferences = useAuthStore((state) => state.preferences)
  const token = useAuthStore((state) => state.token)

  const recommended = useMemo(() => {
    if (!preferences) {
      return opportunities
    }

    return [...opportunities]
      .map((opportunity) => {
        const typeMatch =
          preferences.opportunityType === 'both' || preferences.opportunityType === opportunity.type
        const locationMatch =
          opportunity.location.toLowerCase() === preferences.location.toLowerCase() ||
          opportunity.mode === preferences.workMode
        const skillHits = opportunity.skills.filter((skill) =>
          preferences.skills.some((userSkill) => userSkill.toLowerCase() === skill.toLowerCase()),
        ).length

        return {
          ...opportunity,
          match: opportunity.match + (typeMatch ? 3 : 0) + (locationMatch ? 2 : 0) + skillHits * 2,
        }
      })
      .sort((first, second) => second.match - first.match)
  }, [preferences])

  const preferredSkills = preferences?.skills.length ? preferences.skills : ['React', 'TypeScript']
  const topOpportunity = recommended[0]
  const highMatchCount = recommended.filter((opportunity) => opportunity.match >= 90).length
  const remoteFriendlyCount = recommended.filter((opportunity) => opportunity.mode !== 'Onsite').length
  const averageMatch = recommended.length
    ? `${Math.round(recommended.reduce((sum, opportunity) => sum + opportunity.match, 0) / recommended.length)}%`
    : '0%'

  const getReasons = (opportunity: Opportunity) => {
    const matchingSkill = opportunity.skills.find((skill) =>
      preferredSkills.some((preferredSkill) => preferredSkill.toLowerCase() === skill.toLowerCase()),
    )

    return [
      matchingSkill ? `Strong overlap with your ${matchingSkill} skillset` : 'Expands the profile you are building',
      opportunity.mode === (preferences?.workMode ?? 'Remote')
        ? `Aligned with your ${opportunity.mode.toLowerCase()} work preference`
        : `${opportunity.mode} format gives you flexibility`,
      opportunity.deadline === 'Rolling'
        ? 'Rolling applications keep this option open'
        : `Deadline window closes on ${opportunity.deadline}`,
    ]
  }

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#e0f2fe_0%,_#eff6ff_24%,_#f8fafc_52%,_#ffffff_100%)] text-slate-950">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[38rem] bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(12,74,110,0.96)_42%,_rgba(8,145,178,0.88)_100%)]" />
        <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

        <section className="relative px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          <header className="rounded-[28px] border border-white/12 bg-white/8 p-5 text-white shadow-[0_30px_100px_-48px_rgba(8,47,73,0.95)] backdrop-blur md:p-7 lg:p-8">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <p className="text-xs font-black uppercase tracking-[0.3em] text-cyan-200">opTrackAI dashboard</p>
                <h1 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl xl:text-6xl">
                  A full-screen command center for your next best opportunities
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                  Welcome back, {user?.username ?? 'builder'}. Your dashboard now stretches across the page so the top
                  matches, profile signal, and next actions are all visible without feeling boxed in.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <button
                  className="h-12 rounded-2xl border border-white/18 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/18"
                  onClick={onEditPreferences}
                  type="button"
                >
                  Edit preferences
                </button>
                <button
                  className="h-12 rounded-2xl bg-white px-5 text-sm font-black text-slate-950 transition hover:bg-slate-100"
                  onClick={onLogout}
                  type="button"
                >
                  Log out
                </button>
              </div>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[1.3fr_0.9fr_0.9fr]">
              <div className="rounded-[26px] border border-white/12 bg-white/10 p-5 backdrop-blur">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="border-cyan-300/30 bg-cyan-300/12 text-cyan-100" tone="slate">
                    {highMatchCount} high-match picks
                  </Badge>
                  <Badge className="border-emerald-300/30 bg-emerald-300/12 text-emerald-100" tone="slate">
                    {remoteFriendlyCount} flexible options
                  </Badge>
                </div>
                <p className="mt-5 text-xs font-black uppercase tracking-[0.16em] text-slate-300">Lead recommendation</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white sm:text-3xl">
                  {topOpportunity?.title ?? 'No opportunities yet'}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  {topOpportunity
                    ? `${topOpportunity.location} / ${topOpportunity.mode} / ${topOpportunity.reward}`
                    : 'Complete your preference setup to surface stronger recommendations.'}
                </p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <GlassStat label="Average fit" value={averageMatch} />
                  <GlassStat label="Preferred mode" value={preferences?.workMode ?? 'Remote'} />
                  <GlassStat label="Commitment" value={preferences?.timeCommitment ?? '1 week'} />
                </div>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-slate-950/24 p-5 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-300">Your lane</p>
                <div className="mt-4 space-y-4">
                  <InfoLine label="Target" value={preferences?.target ?? 'Not set'} />
                  <InfoLine label="Opportunity" value={preferences?.opportunityType ?? 'Not set'} />
                  <InfoLine label="Location" value={preferences?.location || 'Not set'} />
                  <InfoLine label="JWT status" value={token ? 'Connected' : 'Waiting for backend'} />
                </div>
              </div>

              <div className="rounded-[26px] border border-white/12 bg-white p-5 text-slate-950 shadow-[0_24px_80px_-44px_rgba(34,211,238,0.55)]">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-cyan-700">Profile signal</p>
                <h2 className="mt-2 text-xl font-black tracking-[-0.03em] text-slate-950">Ready to apply faster</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Your strongest surface area right now is around {preferredSkills[0]}-leaning roles with{' '}
                  {preferences?.workMode ?? 'remote'} flexibility.
                </p>
                <div className="mt-5 space-y-4">
                  <MetricBar
                    label="Match quality"
                    value={averageMatch}
                    width={`${Math.min(Number.parseInt(averageMatch, 10), 100)}%`}
                  />
                  <MetricBar
                    label="Profile completion"
                    value={token ? '100%' : '76%'}
                    width={token ? '100%' : '76%'}
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="mt-6 grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
            <aside className="space-y-5">
              <Card className="rounded-[26px] bg-[linear-gradient(180deg,_#ffffff_0%,_#f8fbff_100%)] shadow-[0_24px_80px_-48px_rgba(15,23,42,0.28)]">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">Skill map</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">Strengths in rotation</h2>
                <div className="mt-5 flex flex-wrap gap-2">
                  {preferredSkills.map((skill) => (
                    <span
                      className="rounded-full border border-cyan-100 bg-cyan-50 px-3 py-1.5 text-xs font-black text-cyan-900"
                      key={skill}
                    >
                      {skill}
                    </span>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-6 text-slate-600">
                  The current opportunity mix leans toward product-building, frontend execution, and fast feedback-loop
                  teams.
                </p>
              </Card>

              <Card className="rounded-[26px] bg-slate-950 text-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.92)]">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Momentum</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">What to do next</h2>
                <div className="mt-5 grid gap-3">
                  <ActionNote
                    title="Apply while the signal is hot"
                    text="Start with the first card and tailor your profile to the highlighted skills."
                  />
                  <ActionNote
                    title="Refresh your filters"
                    text="If you want more onsite or city-specific roles, edit preferences and re-rank the feed."
                  />
                  <ActionNote
                    title="Expand one missing skill"
                    text="A little Node.js or cloud depth would widen the high-match set quickly."
                  />
                </div>
              </Card>
            </aside>

            <div className="space-y-5">
              <div className="grid gap-4 md:grid-cols-3">
                <StatCard icon="01" label="Top matches" value={`${recommended.length}`} />
                <StatCard icon="WF" label="Preferred mode" value={preferences?.workMode ?? 'Remote'} />
                <StatCard icon="TM" label="Time commitment" value={preferences?.timeCommitment ?? '1 week'} />
              </div>

              <Card className="rounded-[26px] border-cyan-100 bg-[linear-gradient(135deg,_rgba(236,254,255,0.98),_rgba(239,246,255,0.92))] shadow-[0_24px_80px_-48px_rgba(14,165,233,0.45)]">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">Opportunity pulse</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                      You have {highMatchCount} roles above 90% match
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      The full-width layout keeps your strongest roles, breakdowns, and call-to-action buttons visible in
                      one scan.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-cyan-200 bg-white px-5 py-4 text-center shadow-sm">
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">Average fit</p>
                    <p className="mt-1 text-4xl font-black tracking-[-0.05em] text-slate-950">{averageMatch}</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-5">
                {recommended.map((opportunity, index) => {
                  const matchingSkillCount = opportunity.skills.filter((skill) =>
                    preferredSkills.some((preferredSkill) => preferredSkill.toLowerCase() === skill.toLowerCase()),
                  ).length

                  return (
                    <Card
                      className="rounded-[28px] border-slate-200/90 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] p-0 shadow-[0_24px_80px_-50px_rgba(15,23,42,0.26)] transition-all duration-300 hover:-translate-y-1 hover:border-cyan-200 hover:shadow-[0_28px_90px_-52px_rgba(14,165,233,0.38)]"
                      key={opportunity.id}
                    >
                      <article className="grid gap-6 p-5 xl:grid-cols-[minmax(0,1.2fr)_320px] xl:p-7">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>{opportunity.type}</Badge>
                            <Badge tone="green">{opportunity.match}% match</Badge>
                            <Badge tone="blue">Rank {index + 1}</Badge>
                          </div>

                          <div className="mt-4 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                            <div className="max-w-3xl">
                              <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-950">{opportunity.title}</h2>
                              <p className="mt-3 text-sm leading-7 text-slate-600">
                                {opportunity.location} / {opportunity.mode} / Deadline {opportunity.deadline}
                              </p>
                            </div>
                            <div className="rounded-[22px] border border-cyan-100 bg-cyan-50/70 px-4 py-3 text-left lg:min-w-56">
                              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">Reward</p>
                              <p className="mt-1 text-sm font-bold text-slate-800">{opportunity.reward}</p>
                            </div>
                          </div>

                          <div className="mt-5 flex flex-wrap gap-2">
                            {opportunity.skills.map((skill) => (
                              <SkillChip
                                active={preferredSkills.some(
                                  (preferredSkill) => preferredSkill.toLowerCase() === skill.toLowerCase(),
                                )}
                                key={skill}
                                skill={skill}
                              />
                            ))}
                          </div>

                          <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
                            <div className="rounded-[22px] border border-slate-200 bg-slate-50/90 p-4">
                              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                Why this fits
                              </p>
                              <div className="mt-3 grid gap-2 md:grid-cols-3">
                                {getReasons(opportunity).map((reason) => (
                                  <div
                                    className="rounded-2xl bg-white px-3 py-3 text-sm font-semibold leading-6 text-slate-700 shadow-sm"
                                    key={reason}
                                  >
                                    {reason}
                                  </div>
                                ))}
                              </div>
                            </div>

                            <div className="rounded-[22px] border border-slate-200 bg-white p-4">
                              <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-500">
                                Match breakdown
                              </p>
                              <div className="mt-3 space-y-3">
                                <MetricBar
                                  label="Skill overlap"
                                  value={`${matchingSkillCount}/${opportunity.skills.length}`}
                                  width={`${Math.max((matchingSkillCount / opportunity.skills.length) * 100, 16)}%`}
                                />
                                <MetricBar
                                  label="Work style alignment"
                                  value={opportunity.mode}
                                  width={opportunity.mode === (preferences?.workMode ?? 'Remote') ? '100%' : '62%'}
                                />
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="rounded-[26px] border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.94)]">
                          <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-400">Next step</p>
                          <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Move on this now</p>
                          <p className="mt-3 text-sm leading-7 text-slate-200">
                            Review the role details, tailor your resume or portfolio to the matching skills, then apply
                            while this opportunity still feels timely.
                          </p>
                          <div className="mt-5 rounded-[20px] border border-white/10 bg-white/6 p-4">
                            <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Priority</p>
                            <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-cyan-300">
                              {opportunity.match}%
                            </p>
                          </div>
                          <a
                            className="mt-5 inline-flex h-12 w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 text-sm font-black text-slate-950 transition hover:bg-cyan-300"
                            href={opportunity.link}
                            rel="noreferrer"
                            target="_blank"
                          >
                            View opportunity
                          </a>
                        </div>
                      </article>
                    </Card>
                  )
                })}
              </div>
            </div>
          </section>
        </section>
      </div>
    </main>
  )
}

function GlassStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[18px] border border-white/12 bg-slate-950/22 px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-300">{label}</p>
      <p className="mt-2 text-xl font-black tracking-[-0.03em] text-white">{value}</p>
    </div>
  )
}

function ActionNote({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/6 p-4">
      <p className="text-sm font-black text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{text}</p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-white">{value}</span>
    </div>
  )
}

function MetricBar({ label, value, width }: { label: string; value: string; width: string }) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-700">{label}</p>
        <p className="text-sm font-black text-slate-950">{value}</p>
      </div>
      <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-slate-200">
        <div
          aria-hidden="true"
          className="h-full rounded-full bg-[linear-gradient(90deg,_#06b6d4_0%,_#0f766e_100%)]"
          style={{ width }}
        />
      </div>
    </div>
  )
}
