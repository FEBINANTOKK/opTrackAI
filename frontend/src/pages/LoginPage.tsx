import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField } from '../components/FormField'
import { ProfessionalAuthShell } from '../components/ProfessionalAuthShell'
import { fetchCurrentUser, login } from '../lib/authApi'
import { useAuthStore } from '../store/useAuthStore'

type LoginPageProps = {
  onSignup: () => void
  onSuccess: () => void
}

export function LoginPage({ onSignup, onSuccess }: LoginPageProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; password?: string }>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newErrors: typeof errors = {}
    if (!username.trim()) newErrors.username = 'Username is required'
    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    try {
      setIsSubmitting(true)
      setErrorMessage('')
      setErrors({})

      const authResponse = await login({ username: username.trim(), password })
      const { user, preference } = await fetchCurrentUser(authResponse.token)

      setToken(authResponse.token)
      setUser(user, 'login')
      if (preference) {
        useAuthStore.getState().setPreferences(preference)
      }
      onSuccess()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to log in right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProfessionalAuthShell
      title="Start your journey"
      subtitle="Discover opportunities tailored for you."
    >
      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        <FormField
          icon="user"
          label="Username"
          error={errors.username}
          onChange={(event) => {
            setUsername(event.target.value)
            if (errors.username) setErrors(prev => ({ ...prev, username: undefined }))
          }}
          placeholder="alex"
          type="text"
          value={username}
        />
        <FormField
          icon="lock"
          label="Password"
          error={errors.password}
          onChange={(event) => {
            setPassword(event.target.value)
            if (errors.password) setErrors(prev => ({ ...prev, password: undefined }))
          }}
          placeholder="At least 6 characters"
          type="password"
          value={password}
        />
        <button
          disabled={isSubmitting}
          className="h-12 w-full rounded-xl bg-gradient-to-r from-[#1257d6] to-blue-600 text-sm font-black text-white shadow-lg shadow-blue-200 transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-xl hover:shadow-blue-300"
          type="submit"
        >
          {isSubmitting ? 'Logging in...' : 'Log in'}
        </button>
        {errorMessage ? <p className="text-sm font-semibold text-red-600">{errorMessage}</p> : null}
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Need an account?{' '}
        <button className="font-bold text-[#1257d6] transition hover:text-[#0c49bd]" onClick={onSignup} type="button">
          Create one
        </button>
      </p>
    </ProfessionalAuthShell>
  )
}
