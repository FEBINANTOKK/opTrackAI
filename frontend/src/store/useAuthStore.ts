import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Preferences, User } from '../types/auth'
import { normalizePreferences } from '../utils/preferenceUtils'

type AuthEntry = 'login' | 'signup' | null

type AuthState = {
  token: string | null
  user: User | null
  preferences: Preferences | null
  authEntry: AuthEntry
  setUser: (user: User, authEntry: Exclude<AuthEntry, null>) => void
  setToken: (token: string) => void
  setPreferences: (preferences: Preferences) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      preferences: null,
      authEntry: null,
      setUser: (user, authEntry) =>
        set(authEntry === 'signup' ? { user, authEntry, preferences: null } : { user, authEntry }),
      setToken: (token) => {
        localStorage.setItem('optrack_token', token)
        set({ token })
      },
      setPreferences: (preferences) => set({ preferences: normalizePreferences(preferences) }),
      logout: () => {
        localStorage.removeItem('optrack_token')
        set({ token: null, user: null, preferences: null, authEntry: null })
      },
    }),
    {
      name: 'optrack-auth',
      partialize: ({ token, user, preferences, authEntry }) => ({ token, user, preferences: normalizePreferences(preferences), authEntry }),
    },
  ),
)
