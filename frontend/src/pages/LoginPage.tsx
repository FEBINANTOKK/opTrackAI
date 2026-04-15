import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField } from '../components/FormField'
import { ProfessionalAuthShell } from '../components/ProfessionalAuthShell'
import { useAuthStore } from '../store/useAuthStore'

type LoginPageProps = {
  onSignup: () => void
  onSuccess: () => void
}

export function LoginPage({ onSignup, onSuccess }: LoginPageProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    setUser({
      id: `local-${username.toLowerCase().replace(/\s+/g, '-') || Date.now()}`,
      username,
    }, 'login')
    onSuccess()
  }

  return (
    <ProfessionalAuthShell
      title="Start your journey"
      subtitle="Discover opportunities tailored for you."
    >
      <form className="space-y-5" onSubmit={handleSubmit}>
        <FormField
          icon="user"
          label="Username"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="alex"
          required
          type="text"
          value={username}
        />
        <FormField
          icon="lock"
          label="Password"
          onChange={(event) => setPassword(event.target.value)}
          placeholder="At least 6 characters"
          required
          type="password"
          value={password}
        />
        <button
          className="h-12 w-full rounded-xl bg-gradient-to-r from-[#1257d6] to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-300"
          type="submit"
        >
          Log in
        </button>
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Need an account?{' '}
        <button className="font-bold text-[#1257d6] transition hover:text-[#0c49bd]" onClick={onSignup}>
          Create one
        </button>
      </p>
    </ProfessionalAuthShell>
  )
}
