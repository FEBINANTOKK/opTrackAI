import type { InputHTMLAttributes, SelectHTMLAttributes } from 'react'

type BaseFieldProps = {
  label: string
  hint?: string
  error?: string
  icon?: 'user' | 'mail' | 'lock' | 'pin'
}

type InputFieldProps = BaseFieldProps &
  InputHTMLAttributes<HTMLInputElement> & {
    as?: 'input'
  }

type SelectFieldProps = BaseFieldProps &
  SelectHTMLAttributes<HTMLSelectElement> & {
    as: 'select'
    options: string[]
  }

type FormFieldProps = InputFieldProps | SelectFieldProps

export function FormField(props: FormFieldProps) {
  const { label, hint, error } = props

  return (
    <label className="group block">
      <div className="flex items-center justify-between gap-3">
        <span className={`text-[11px] font-black uppercase tracking-[0.08em] transition ${
          error ? 'text-red-500' : 'text-slate-500 group-focus-within:text-blue-600'
        }`}>
          {label}
        </span>
        {error ? (
          <span className="text-[10px] font-bold text-red-500 animate-in fade-in slide-in-from-right-1">
            {error}
          </span>
        ) : null}
      </div>
      {props.as === 'select' ? (
        <SelectField {...props} />
      ) : (
        <InputField {...props} />
      )}
      {hint && !error ? <span className="mt-1 block text-xs text-slate-500">{hint}</span> : null}
    </label>
  )
}

function SelectField({ label: _label, hint: _hint, error, icon: _icon, options, as: _as, ...selectProps }: SelectFieldProps) {
  return (
    <select
      {...selectProps}
      className={`mt-2 h-11 w-full rounded-xl border bg-slate-100 px-3 text-sm font-semibold text-slate-800 outline-none transition-all duration-300 ${
        error
          ? 'border-red-500 bg-white ring-4 ring-red-500/10'
          : 'border-transparent focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
      }`}
    >
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  )
}

function InputField({ label: _label, hint: _hint, error, icon, as: _as, ...inputProps }: InputFieldProps) {
  return (
    <div className="relative mt-2">
      {icon ? <FieldIcon error={!!error} icon={icon} /> : null}
      <input
        {...inputProps}
        className={`h-11 w-full rounded-xl border text-sm font-semibold text-slate-800 outline-none transition-all duration-300 placeholder:font-medium placeholder:text-slate-400 ${
          error
            ? 'border-red-500 bg-white ring-4 ring-red-500/10'
            : 'border-transparent bg-slate-100 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10'
        } ${
          icon ? 'pl-10 pr-3' : 'px-3'
        }`}
      />
    </div>
  )
}

function FieldIcon({ icon, error }: { icon: NonNullable<BaseFieldProps['icon']>, error?: boolean }) {
  return (
    <span className={`pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 transition-colors ${
      error ? 'text-red-500' : 'text-slate-400'
    }`}>
      <svg
        aria-hidden="true"
        className="h-4 w-4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
      >
        {icon === 'user' ? (
          <>
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </>
        ) : null}
        {icon === 'mail' ? (
          <>
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </>
        ) : null}
        {icon === 'lock' ? (
          <>
            <rect x="5" y="11" width="14" height="10" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </>
        ) : null}
        {icon === 'pin' ? (
          <>
            <path d="M12 21s7-5.2 7-11a7 7 0 0 0-14 0c0 5.8 7 11 7 11z" />
            <circle cx="12" cy="10" r="2" />
          </>
        ) : null}
      </svg>
    </span>
  )
}
