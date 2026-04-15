import type { AuthResponse, LoginInput, SignupInput, User, Preferences } from '../types/auth'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL?.trim() || '/api'

type ApiErrorPayload = {
  error?: string
}

async function parseJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => ({}))) as T & ApiErrorPayload

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed.')
  }

  return payload
}

export async function signup(input: SignupInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/users/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }).catch(() => {
    throw new Error('Unable to reach the backend. Make sure the API server is running.')
  })

  return parseJson<AuthResponse>(response)
}

export async function login(input: LoginInput): Promise<AuthResponse> {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  }).catch(() => {
    throw new Error('Unable to reach the backend. Make sure the API server is running.')
  })

  return parseJson<AuthResponse>(response)
}

export async function fetchCurrentUser(token: string): Promise<{ user: User; preference: Preferences | null }> {
  const response = await fetch(`${API_BASE_URL}/users/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {
    throw new Error('Unable to reach the backend while validating the login session.')
  })

  const payload = await parseJson<{ user: User; preference?: Preferences }>(response)
  return {
    user: payload.user,
    preference: payload.preference || null,
  }
}

export async function savePreferences(token: string, preferences: Preferences, userId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ ...preferences, userId }),
  }).catch(() => {
    throw new Error('Unable to save preferences.')
  })

  await parseJson(response)
}

export async function fetchPreferences(token: string): Promise<Preferences | null> {
  const response = await fetch(`${API_BASE_URL}/preferences`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).catch(() => {
    return null
  })

  if (!response || !response.ok) return null

  const payload = await parseJson<{ preference: Preferences }>(response)
  return payload.preference
}
