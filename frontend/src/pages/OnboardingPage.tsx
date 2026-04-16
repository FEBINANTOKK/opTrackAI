import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import { FormField } from '../components/FormField'
import { SkillsInput } from '../components/SkillsInput'
import { Card } from '../components/ui/Card'
import { useAuthStore } from '../store/useAuthStore'
import { savePreferences } from '../lib/authApi'
import { normalizePreferences } from '../utils/preferenceUtils'
import type {
  OpportunityType,
  Preferences,
  RewardType,
  Target,
  TimeCommitment,
  WorkMode,
} from '../types/auth'

type OnboardingPageProps = {
  onComplete: () => void
  onBack?: () => void
  editing?: boolean
}

const rewards: RewardType[] = [
  'certificate',
  'cash_prize',
  'internship_offer',
  'job_offer',
  'swags',
  'experience',
]
const workModes: WorkMode[] = ['Remote', 'Onsite', 'Hybrid']
const timeCommitments: TimeCommitment[] = ['1_day', '1_week', '2_weeks', '1_month', 'long_term']
const opportunityTypes: OpportunityType[] = ['hackathon', 'internship', 'job']
const targets: Target[] = ['student', 'job seeker']

const uniqueItems = <T extends string>(items: T[]): T[] => [...new Set(items)]

const joinOrNotSet = (items: string[]): string => (items.length ? items.join(', ') : 'Not set')

export function OnboardingPage({ onComplete, onBack, editing = false }: OnboardingPageProps) {
  const user = useAuthStore((state) => state.user)
  const token = useAuthStore((state) => state.token)
  const preferences = useAuthStore((state) => state.preferences)
  const setPreferences = useAuthStore((state) => state.setPreferences)
  const isEditing = editing || Boolean(preferences)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof Preferences, string>>>({})
  const [form, setForm] = useState<Preferences>(() =>
    normalizePreferences(preferences) ?? {
      target: 'student',
      reward: [],
      college: '',
      year: '',
      location: '',
      workMode: [],
      timeCommitment: [],
      opportunityType: [],
      skills: [],
    },
  )

  useEffect(() => {
    if (preferences && !isSubmitting) {
      setForm(normalizePreferences(preferences))
    }
  }, [preferences, isSubmitting])

  const updateForm = <Key extends keyof Preferences>(key: Key, value: Preferences[Key]) => {
    setForm((current) => ({ ...current, [key]: value }))
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const toggleMultiValue = <
    K extends 'reward' | 'workMode' | 'timeCommitment' | 'opportunityType',
  >(
    key: K,
    value: Preferences[K][number],
  ) => {
    setForm((current) => {
      const currentValues = current[key] as string[]
      const nextValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value]

      return {
        ...current,
        [key]: nextValues,
      }
    })
    if (errors[key]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }))
    }
  }

  const clearMultiField = (key: 'reward' | 'workMode' | 'timeCommitment' | 'opportunityType') => {
    setForm((current) => ({
      ...current,
      [key]: [],
    }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError('')
    
    // Comprehensive Validation
    const newErrors: typeof errors = {}
    if (form.reward.length === 0) newErrors.reward = 'Select at least one reward'
    if (form.target === 'student') {
      if (!form.college?.trim()) newErrors.college = 'College name is required'
      if (!form.year?.trim()) newErrors.year = 'Graduation year is required'
    }
    if (!form.location.trim()) newErrors.location = 'Preferred location is required'
    if (form.workMode.length === 0) newErrors.workMode = 'Select at least one work mode'
    if (form.timeCommitment.length === 0) newErrors.timeCommitment = 'Select at least one commitment level'
    if (form.opportunityType.length === 0) newErrors.opportunityType = 'Select at least one opportunity type'
    if (form.skills.length === 0) newErrors.skills = 'Add at least one skill to personalize your feed'

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // Scroll to top error or just show global message
      setError('Please fix the highlighted fields before continuing.')
      window.scrollTo({ top: 0, behavior: 'smooth' })
      return
    }

    const finalizedPreferences: Preferences = {
      ...form,
      college: form.target === 'student' ? form.college?.trim() : undefined,
      year: form.target === 'student' ? form.year?.trim() : undefined,
      location: form.location.trim(),
      reward: uniqueItems(form.reward),
      workMode: uniqueItems(form.workMode),
      timeCommitment: uniqueItems(form.timeCommitment),
      opportunityType: uniqueItems(form.opportunityType),
      skills: uniqueItems(form.skills.map((skill) => skill.trim()).filter(Boolean)),
    }

    setIsSubmitting(true)

    try {
      if (token && user?.id) {
        await savePreferences(token, finalizedPreferences, user.id)
      }
      setPreferences(finalizedPreferences)
      onComplete()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const completedSections = [
    Boolean(
      form.target &&
        form.reward.length > 0 &&
        (form.target !== 'student' || (form.college?.trim() && form.year?.trim())),
    ),
    Boolean(form.location.trim() && form.workMode.length > 0),
    Boolean(form.timeCommitment.length > 0 && form.opportunityType.length > 0),
    Boolean(form.skills.length),
  ].filter(Boolean).length

  return (
    <main className="min-h-screen overflow-x-hidden bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(14,165,233,0.12),_transparent_32%),linear-gradient(180deg,_#e0f2fe_0%,_#eff6ff_24%,_#f8fafc_52%,_#ffffff_100%)] text-slate-950">
      <div className="relative">
        <div className="absolute inset-x-0 top-0 h-[38rem] bg-[linear-gradient(135deg,_rgba(15,23,42,0.98)_0%,_rgba(12,74,110,0.96)_42%,_rgba(8,145,178,0.88)_100%)]" />
        <div className="absolute left-[-8rem] top-16 h-72 w-72 rounded-full bg-cyan-300/20 blur-3xl" />
        <div className="absolute right-[-6rem] top-32 h-80 w-80 rounded-full bg-sky-300/20 blur-3xl" />

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

          <form className="mt-6 grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]" onSubmit={handleSubmit} noValidate>
            <aside className="space-y-5">
              <Card className="rounded-[28px] border-slate-200/90 bg-[linear-gradient(180deg,_#ffffff_0%,_#fbfdff_100%)] shadow-[0_24px_80px_-48px_rgba(15,23,42,0.3)] backdrop-blur">
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
                  <ProfileLine label="Reward" value={form.reward} />
                  <ProfileLine label="Work mode" value={form.workMode} />
                  <ProfileLine label="Time commitment" value={form.timeCommitment} />
                  <ProfileLine label="Opportunity" value={form.opportunityType} />
                  <ProfileLine label="Location" value={form.location || 'Not set'} />
                </div>
                <div className="mt-5 rounded-[22px] border border-white/10 bg-white/6 p-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.14em] text-slate-400">Skills added</p>
                  <p className="mt-2 text-4xl font-black tracking-[-0.05em] text-cyan-300">{form.skills.length}</p>
                </div>
              </Card>
            </aside>

            <div className="space-y-6">
              {error && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600 animate-in fade-in slide-in-from-top-1">
                  {error}
                </div>
              )}

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
                </div>
                <div className="mt-5">
                  <MultiSelectField
                    label="Rewards"
                    options={rewards}
                    selected={form.reward}
                    error={errors.reward}
                    onToggle={(value) => toggleMultiValue('reward', value as RewardType)}
                    onClear={() => clearMultiField('reward')}
                  />
                </div>
                {form.target === 'student' ? (
                  <div className="mt-5 grid gap-5 lg:grid-cols-2">
                    <FormField
                      label="College"
                      error={errors.college}
                      onChange={(event) => updateForm('college', event.target.value)}
                      placeholder="e.g. Massachusetts Institute"
                      type="text"
                      value={form.college}
                    />
                    <FormField
                      label="Graduation year"
                      error={errors.year}
                      onChange={(event) => updateForm('year', event.target.value)}
                      placeholder="2026"
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
                    error={errors.location}
                    onChange={(event) => updateForm('location', event.target.value)}
                    placeholder="City or country"
                    type="text"
                    value={form.location}
                  />
                </div>
                <div className="mt-5">
                  <MultiSelectField
                    label="Work modes"
                    options={workModes}
                    selected={form.workMode}
                    error={errors.workMode}
                    onToggle={(value) => toggleMultiValue('workMode', value as WorkMode)}
                    onClear={() => clearMultiField('workMode')}
                  />
                </div>
              </OnboardingSection>

              <OnboardingSection
                eyebrow="03. Preferences"
                helper="Set the opportunity shape you want to see first, along with the level of time you can realistically commit."
                title="Engagement style"
              >
                <div className="grid gap-5 lg:grid-cols-2">
                  <MultiSelectField
                    label="Time commitment"
                    options={timeCommitments}
                    selected={form.timeCommitment}
                    error={errors.timeCommitment}
                    onToggle={(value) => toggleMultiValue('timeCommitment', value as TimeCommitment)}
                    onClear={() => clearMultiField('timeCommitment')}
                  />
                  <MultiSelectField
                    label="Opportunity type"
                    options={opportunityTypes}
                    selected={form.opportunityType}
                    error={errors.opportunityType}
                    onToggle={(value) => toggleMultiValue('opportunityType', value as OpportunityType)}
                    onClear={() => clearMultiField('opportunityType')}
                  />
                </div>
              </OnboardingSection>

              <OnboardingSection
                eyebrow="04. Expertise"
                helper="Add skills one at a time so the dashboard can explain why each opportunity deserves its rank."
                title="Skill matrix"
              >
                <div className={`rounded-[28px] transition-all ${errors.skills ? 'ring-2 ring-red-500/50 p-2 bg-red-50/30' : ''}`}>
                  <SkillsInput skills={form.skills} onChange={(skills) => updateForm('skills', skills)} />
                  {errors.skills && (
                    <p className="mt-2 text-[10px] font-bold text-red-500">{errors.skills}</p>
                  )}
                </div>
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
                      {isSubmitting ? 'Analyzing profile...' : isEditing ? 'Update preferences' : 'Build my trajectory'}
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
    <div className="rounded-[20px] border border-slate-200 bg-white px-4 py-4">
      <p className="text-[11px] font-black uppercase tracking-[0.14em] text-cyan-700">{index}</p>
      <p className="mt-2 text-sm font-black text-slate-900">{title}</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
    </div>
  )
}

function MultiSelectField({
  label,
  options,
  selected,
  onToggle,
  onClear,
  error,
}: {
  label: string
  options: string[]
  selected: string[]
  onToggle: (value: string) => void
  onClear: () => void
  error?: string
}) {
  return (
    <div className={`rounded-2xl border bg-slate-50 p-4 transition-all duration-300 ${
      error ? 'border-red-500 ring-4 ring-red-500/10' : 'border-slate-200'
    }`}>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className={`text-sm font-black ${error ? 'text-red-500' : 'text-slate-900'}`}>{label}</p>
          {error && (
            <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-left-1">
              — {error}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClear}
          disabled={!selected.length}
          className="text-xs font-black uppercase tracking-[0.08em] text-slate-500 transition hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear all
        </button>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = selected.includes(option)
          return (
            <label
              key={option}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                checked
                  ? 'border-blue-200 bg-blue-50 text-[#1257d6]'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(option)}
                className="h-4 w-4 accent-[#1257d6]"
              />
              <span className="capitalize">{option.replace('_', ' ')}</span>
            </label>
          )
        })}
      </div>
      <div className="mt-3 flex min-h-10 flex-wrap gap-2">
        {selected.map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => onToggle(item)}
            className="rounded-full border border-blue-100 bg-white px-3 py-1 text-xs font-black text-[#1257d6] transition hover:border-blue-200 hover:bg-blue-50"
          >
            {item.replace('_', ' ')} ×
          </button>
        ))}
      </div>
    </div>
  )
}

function ProfileLine({ label, value }: { label: string; value: string | string[] }) {
  const displayValue = Array.isArray(value) ? joinOrNotSet(value) : value

  return (
    <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
      <span className="text-sm text-slate-300">{label}</span>
      <span className="text-right text-sm font-bold capitalize text-white">{displayValue}</span>
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
