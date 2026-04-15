import { useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { FormField } from '../components/FormField'
import { SkillsInput } from '../components/SkillsInput'
import { Card } from '../components/ui/Card'
import { useAuthStore } from '../store/useAuthStore'
import type { OpportunityType, Preferences, Target, WorkMode } from '../types/auth'

type OnboardingPageProps = {
  onComplete: () => void
  onBack?: () => void
  editing?: boolean
}

const timeCommitments = ['24 hours', '3 days', '1 week', '2 weeks', '1 month']
const workModes: WorkMode[] = ['Remote', 'Onsite', 'Hybrid']
const opportunityTypes: OpportunityType[] = ['hackathon', 'internship', 'job', 'both']
const targets: Target[] = ['student', 'job seeker']

export function OnboardingPage({ onComplete, onBack, editing = false }: OnboardingPageProps) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const preferences = useAuthStore((state) => state.preferences)
  const setPreferences = useAuthStore((state) => state.setPreferences)
  const isEditing = editing || Boolean(preferences)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [form, setForm] = useState<Preferences>(
    () =>
      preferences ?? {
        timeCommitment: '1 week',
        location: '',
        workMode: 'Remote',
        skills: [],
        college: '',
        year: '',
        reward: '',
        opportunityType: 'both',
        target: 'student',
      },
  )

  const updateForm = <Key extends keyof Preferences>(key: Key, value: Preferences[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const finalizedPreferences: Preferences = {
      ...form,
      college: form.target === 'student' ? form.college?.trim() : undefined,
      year: form.target === 'student' ? form.year?.trim() : undefined,
      location: form.location.trim(),
      reward: form.reward.trim(),
      skills: form.skills.map((skill) => skill.trim()).filter(Boolean),
    }

    const payload = {
      auth: {
        token,
        userId: user?.id,
      },
      preferences: finalizedPreferences,
      submittedAt: new Date().toISOString(),
    }

    setIsSubmitting(true)

    setTimeout(() => {
      setPreferences(finalizedPreferences)
      console.log('Onboarding API payload:', payload)
      setIsSubmitting(false)
      onComplete()
    }, 1200)
  }

  const completedSections = [
    Boolean(form.target && form.reward.trim() && (form.target !== 'student' || (form.college?.trim() && form.year?.trim()))),
    Boolean(form.location.trim() && form.workMode),
    Boolean(form.timeCommitment && form.opportunityType),
    Boolean(form.skills.length),
  ].filter(Boolean).length

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.16),_transparent_24%),radial-gradient(circle_at_bottom_right,_rgba(45,212,191,0.12),_transparent_28%),linear-gradient(180deg,_#e0f2fe_0%,_#f8fbff_34%,_#ffffff_100%)] text-slate-950">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[28rem] bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(30,41,59,0.96)_38%,_rgba(14,116,144,0.88)_100%)]" />
        <div className="absolute left-[-6rem] top-10 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-8rem] top-24 h-80 w-80 rounded-full bg-emerald-300/18 blur-3xl" />

        <section className="relative px-4 pb-8 pt-5 sm:px-6 lg:px-8 lg:pb-10 lg:pt-6">
          <header className="rounded-[30px] border border-white/12 bg-white/8 p-5 text-white shadow-[0_30px_100px_-50px_rgba(15,23,42,0.95)] backdrop-blur md:p-7 lg:p-8">
            <div className="flex flex-col gap-8 xl:flex-row xl:items-end xl:justify-between">
              <div className="max-w-4xl">
                <div className="flex items-center gap-3">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white/12 text-sm font-black text-white ring-1 ring-white/14">
                    OT
                  </div>
                  <p className="text-sm font-black uppercase tracking-[0.24em] text-cyan-200">Preference studio</p>
                </div>
                <h1 className="mt-6 max-w-3xl text-4xl font-black tracking-[-0.05em] text-white sm:text-5xl xl:text-6xl">
                  {isEditing ? 'Edit preferences in a full-screen workspace' : 'Build your opportunity profile in one flow'}
                </h1>
                <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-200 sm:text-base">
                  {isEditing
                    ? 'Adjust your goals, location, and skills here. The dashboard will immediately reflect the new ranking logic.'
                    : 'Set your profile once and let opTrackAI shape the dashboard around your timeline, work style, and strengths.'}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {onBack ? (
                  <button
                    type="button"
                    onClick={onBack}
                    className="inline-flex h-12 items-center gap-2 rounded-2xl border border-white/16 bg-white/10 px-5 text-sm font-bold text-white transition hover:bg-white/18"
                  >
                    Back to dashboard
                  </button>
                ) : null}
                <div className="rounded-[24px] border border-white/14 bg-slate-950/22 px-5 py-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">Profile status</p>
                  <p className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">{user?.username || 'New user'}</p>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-4 xl:grid-cols-[1.25fr_0.95fr_0.9fr]">
              <div className="rounded-[26px] border border-white/12 bg-white/10 p-5 backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-200">Profile customization</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Personalize your AI feed</h2>
                <p className="mt-3 text-sm leading-6 text-slate-200">
                  This full-width editor gives each section more room, so the form feels like a workspace instead of a small card.
                </p>
                <div className="mt-5 flex gap-2">
                  {[1, 2, 3, 4].map((step) => (
                    <span
                      className={`h-2.5 flex-1 rounded-full ${step <= completedSections ? 'bg-cyan-300' : 'bg-white/18'}`}
                      key={step}
                    />
                  ))}
                </div>
              </div>

              <HeaderStat label="Sections complete" value={`${completedSections}/4`} />
              <HeaderStat label="JWT status" value={token ? 'Connected' : 'Pending'} />
            </div>
          </header>

          <form className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]" onSubmit={handleSubmit}>
            <aside className="space-y-5">
              <Card className="rounded-[28px] bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] backdrop-blur">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">Navigator</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">Profile blocks</h2>
                <div className="mt-5 grid gap-3">
                  <SectionChip index="01" title="Identity" text="Target, reward, and academic context." />
                  <SectionChip index="02" title="Logistics" text="Location and work mode preferences." />
                  <SectionChip index="03" title="Preferences" text="Commitment and opportunity type." />
                  <SectionChip index="04" title="Expertise" text="Skills that sharpen your ranking." />
                </div>
              </Card>

              <Card className="rounded-[28px] bg-slate-950 text-white shadow-[0_24px_80px_-42px_rgba(15,23,42,0.92)]">
                <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-200">Live profile</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-white">Current direction</h2>
                <div className="mt-5 space-y-4">
                  <ProfileLine label="Target" value={form.target} />
                  <ProfileLine label="Work mode" value={form.workMode} />
                  <ProfileLine label="Location" value={form.location || 'Not set'} />
                  <ProfileLine label="Opportunity" value={form.opportunityType} />
                </div>
                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Skills added</p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-cyan-300">{form.skills.length}</p>
                </div>
              </Card>
            </aside>

            <div className="space-y-6">
              <OnboardingSection
                eyebrow="01. Identity"
                helper="Tell us who you are so the recommendation engine knows what stage you are currently optimizing for."
                title="Academic foundation"
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField
                    as="select"
                    label="Target"
                    onChange={(event) => updateForm('target', event.target.value as Target)}
                    options={targets}
                    value={form.target}
                  />
                  <FormField
                    label="Reward"
                    onChange={(event) => updateForm('reward', event.target.value)}
                    placeholder="e.g. stipend, certificate"
                    required
                    type="text"
                    value={form.reward}
                  />
                </div>
                {form.target === 'student' ? (
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <FormField
                      label="College"
                      onChange={(event) => updateForm('college', event.target.value)}
                      placeholder="e.g. Massachusetts Institute"
                      required
                      type="text"
                      value={form.college}
                    />
                    <FormField
                      label="Graduation year"
                      onChange={(event) => updateForm('year', event.target.value)}
                      placeholder="2026"
                      required
                      type="text"
                      value={form.year}
                    />
                  </div>
                ) : null}
              </OnboardingSection>

              <OnboardingSection
                eyebrow="02. Logistics"
                helper="Use the full-width form to define where and how you want to work so nearby and flexible roles rank correctly."
                title="Work parameters"
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField
                    icon="pin"
                    label="Preferred location"
                    onChange={(event) => updateForm('location', event.target.value)}
                    placeholder="City or country"
                    required
                    type="text"
                    value={form.location}
                  />
                  <FormField
                    as="select"
                    label="Work mode"
                    onChange={(event) => updateForm('workMode', event.target.value as WorkMode)}
                    options={workModes}
                    value={form.workMode}
                  />
                </div>
              </OnboardingSection>

              <OnboardingSection
                eyebrow="03. Preferences"
                helper="Set the opportunity shape you want to see first, along with the level of time you can realistically commit."
                title="Engagement style"
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <FormField
                    as="select"
                    label="Time commitment"
                    onChange={(event) => updateForm('timeCommitment', event.target.value)}
                    options={timeCommitments}
                    value={form.timeCommitment}
                  />
                  <FormField
                    as="select"
                    label="Opportunity type"
                    onChange={(event) => updateForm('opportunityType', event.target.value as OpportunityType)}
                    options={opportunityTypes}
                    value={form.opportunityType}
                  />
                </div>
              </OnboardingSection>

              <OnboardingSection
                eyebrow="04. Expertise"
                helper="Add skills one at a time so the dashboard can explain why each opportunity deserves its rank."
                title="Skill matrix"
              >
                <SkillsInput skills={form.skills} onChange={(skills) => updateForm('skills', skills)} />
              </OnboardingSection>

              <Card className="rounded-[28px] border-cyan-100 bg-[linear-gradient(135deg,_rgba(236,254,255,0.98),_rgba(239,246,255,0.92))] shadow-[0_24px_80px_-48px_rgba(14,165,233,0.42)]">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">Finalize profile</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-950">
                      {isEditing ? 'Save the updated ranking signals' : 'Launch your dashboard with a stronger profile'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Once you submit, the dashboard will refresh using these updated constraints and skills.
                    </p>
                  </div>
                  <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center">
                    <button
                      className="h-12 rounded-2xl px-5 text-sm font-black text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                      type="button"
                      onClick={onBack}
                    >
                      {isEditing ? 'Cancel' : 'Skip for now'}
                    </button>
                    <button
                      className="inline-flex h-12 items-center justify-center rounded-2xl bg-[#1257d6] px-8 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all hover:-translate-y-0.5 hover:bg-[#0c49bd] active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                      disabled={isSubmitting}
                      type="submit"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            />
                            <path
                              className="opacity-75"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                              fill="currentColor"
                            />
                          </svg>
                          Analyzing profile...
                        </span>
                      ) : isEditing ? (
                        'Update preferences'
                      ) : (
                        'Build my trajectory'
                      )}
                    </button>
                  </div>
                </div>
              </Card>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}

function HeaderStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[26px] border border-white/12 bg-slate-950/24 p-5 backdrop-blur">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-slate-300">{label}</p>
      <p className="mt-2 text-3xl font-black tracking-[-0.04em] text-white">{value}</p>
    </div>
  )
}

function SectionChip({ index, title, text }: { index: string; title: string; text: string }) {
  return (
    <div className="rounded-[20px] border border-slate-200 bg-slate-50 px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">{index}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function ProfileLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-white">{value}</span>
    </div>
  )
}

function OnboardingSection({
  eyebrow,
  helper,
  title,
  children,
}: {
  eyebrow: string
  helper: string
  title: string
  children: ReactNode
}) {
  return (
    <section className="rounded-[28px] border border-slate-200/80 bg-white/96 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.24)] backdrop-blur lg:p-8">
      <p className="text-[11px] font-black uppercase tracking-[0.16em] text-cyan-700">{eyebrow}</p>
      <h2 className="mt-2 text-2xl font-black tracking-[-0.03em] text-slate-900">{title}</h2>
      <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{helper}</p>
      <div className="mt-6">{children}</div>
    </section>
  )
}
