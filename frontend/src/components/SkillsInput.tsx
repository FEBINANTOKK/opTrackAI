import { useState } from 'react'

type SkillsInputProps = {
  skills: string[]
  onChange: (skills: string[]) => void
}

export function SkillsInput({ skills, onChange }: SkillsInputProps) {
  const [draft, setDraft] = useState('')

  const addSkill = () => {
    const nextSkill = draft.trim()

    if (!nextSkill || skills.some((skill) => skill.toLowerCase() === nextSkill.toLowerCase())) {
      setDraft('')
      return
    }

    onChange([...skills, nextSkill])
    setDraft('')
  }

  const removeSkill = (skillToRemove: string) => {
    onChange(skills.filter((skill) => skill !== skillToRemove))
  }

  return (
    <div>
      <span className="text-[11px] font-black uppercase tracking-[0.08em] text-slate-500">Top skills</span>
      <div className="mt-2 flex gap-2">
        <input
          className="h-11 min-w-0 flex-1 rounded-lg border border-transparent bg-slate-100 px-3 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 focus:border-[#1257d6] focus:bg-white focus:ring-4 focus:ring-blue-100"
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault()
              addSkill()
            }
            if (event.key === 'Escape') {
              setDraft('')
            }
          }}
          placeholder="React, Python, UI design"
          type="text"
          value={draft}
        />
        <button
          className="h-11 rounded-lg bg-[#1257d6] px-4 text-sm font-black text-white transition-all hover:bg-[#0c49bd] active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={!draft.trim()}
          onClick={addSkill}
          type="button"
        >
          Add
        </button>
      </div>
      <div className="mt-3 flex min-h-10 flex-wrap gap-2">
        {skills.map((skill) => (
          <button
            className="rounded-full border border-blue-100 bg-slate-100 px-3 py-1.5 text-xs font-black text-slate-700 transition-all duration-200 hover:scale-110 hover:border-blue-200 hover:bg-blue-50 hover:text-[#1257d6] active:scale-95"
            key={skill}
            onClick={() => removeSkill(skill)}
            type="button"
          >
            {skill} ×
          </button>
        ))}
      </div>
    </div>
  )
}
