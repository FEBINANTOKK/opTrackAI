type SkillChipProps = {
  skill: string
  active?: boolean
}

export function SkillChip({ skill, active = false }: SkillChipProps) {
  return (
    <span
      className={`rounded-full px-3 py-1.5 text-xs font-black transition-colors ${
        active ? 'bg-blue-50 text-[#1257d6]' : 'border border-slate-200 bg-white text-slate-600'
      }`}
    >
      {skill}
    </span>
  )
}
