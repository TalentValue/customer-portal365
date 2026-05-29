import { useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

// Module-level flag — prevents React StrictMode's double-invocation of useEffect
// from firing two simultaneous /api/auth/refresh calls, which causes the second
// call to get a 401 (the session row was already rotated by the first call),
// triggering logout() and a spurious redirect to /login.
let restoreRan = false

export function useSessionRestore() {
  useEffect(() => {
    if (restoreRan) return
    restoreRan = true

    const run = async () => {
      // Zustand persist hydration is async even for synchronous storage.
      // Reading the store before it completes returns the initial null values.
      // The inner hasHydrated() check closes the TOCTOU window: if hydration
      // completed between the outer check and the subscribe call, the callback
      // would never fire and the promise would hang forever.
      if (!useAuthStore.persist.hasHydrated()) {
        await new Promise<void>((resolve) => {
          if (useAuthStore.persist.hasHydrated()) { resolve(); return }
          const unsub = useAuthStore.persist.onFinishHydration(() => {
            unsub()
            resolve()
          })
        })
      }

      const { user, setAccessToken, logout, setRestoring } = useAuthStore.getState()

      if (!user) {
        setRestoring(false)
        return
      }

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, {
          withCredentials: true,
          timeout: 5000,
        })
        setAccessToken(data.accessToken)
      } catch {
        // Cookie expired or missing — clear stale local state
        logout()
      } finally {
        setRestoring(false)
      }
    }

    run()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps
}
