import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/types'

interface AuthState {
  user: User | null
  accessToken: string | null
  isAuthenticated: boolean
  isRestoring: boolean
  setUser: (user: User) => void
  setAccessToken: (token: string) => void
  setRestoring: (v: boolean) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,
      isRestoring: true,
      setUser: (user) => set({ user, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setRestoring: (isRestoring) => set({ isRestoring }),
      logout: () => set({ user: null, accessToken: null, isAuthenticated: false, isRestoring: false }),
    }),
    {
      name: 'cp365-auth',
      // Persist user + isAuthenticated so layouts don't flash-redirect on refresh.
      // accessToken is intentionally excluded — kept in-memory only to prevent
      // XSS access; useSessionRestore fetches a fresh one via httpOnly cookie on boot.
      // isRestoring is excluded — always starts true, resolved by useSessionRestore.
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
)
