import { useState } from 'react'
import type { FormEvent } from 'react'
import { FormField } from '../components/FormField'
import { ProfessionalAuthShell } from '../components/ProfessionalAuthShell'
import { fetchCurrentUser, signup } from '../lib/authApi'
import { useAuthStore } from '../store/useAuthStore'

type SignupPageProps = {
  onLogin: () => void
  onSuccess: () => void
}

export function SignupPage({ onLogin, onSuccess }: SignupPageProps) {
  const setUser = useAuthStore((state) => state.setUser)
  const setToken = useAuthStore((state) => state.setToken)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ username?: string; email?: string; password?: string }>({})
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const newErrors: typeof errors = {}
    if (!username.trim()) newErrors.username = 'Username is required'
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!email.trim()) {
      newErrors.email = 'Email is required'
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Invalid email address'
    }

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

      const authResponse = await signup({
        username: username.trim(),
        email: email.trim(),
        password,
      })
      const user: any = await fetchCurrentUser(authResponse.token)

      setToken(authResponse.token)
      setUser(user, 'signup')
      onSuccess()
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Unable to sign up right now.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <ProfessionalAuthShell title="Start your journey" subtitle="Discover opportunities tailored for you.">
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
          icon="mail"
          label="Email"
          error={errors.email}
          onChange={(event) => {
            setEmail(event.target.value)
            if (errors.email) setErrors(prev => ({ ...prev, email: undefined }))
          }}
          placeholder="alex@example.com"
          type="email"
          value={email}
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
          {isSubmitting ? 'Creating account...' : 'Sign up'}
        </button>
        {errorMessage ? <p className="text-sm font-semibold text-red-600">{errorMessage}</p> : null}
      </form>
      <p className="mt-6 text-center text-sm text-slate-600">
        Already have an account?{' '}
        <button className="font-bold text-[#1257d6] transition hover:text-[#0c49bd]" onClick={onLogin} type="button">
          Log in
        </button>
      </p>
    </ProfessionalAuthShell>
  )
}
