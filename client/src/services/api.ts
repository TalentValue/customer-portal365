import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
let loggingOut = false
let queue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = []

async function doLogout() {
  if (loggingOut) return
  loggingOut = true
  try {
    await axios.post('/api/auth/logout', {}, { withCredentials: true })
  } catch {
    // ignore — server may already have invalidated the session
  } finally {
    useAuthStore.getState().logout()
    loggingOut = false
    window.location.href = '/login'
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status === 401 && !original._retry) {
      if (loggingOut) return Promise.reject(error)
      if (refreshing) {
        return new Promise((resolve, reject) => {
          queue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        })
      }
      original._retry = true
      refreshing = true
      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = data.accessToken
        useAuthStore.getState().setAccessToken(newToken)
        queue.forEach((p) => p.resolve(newToken))
        queue = []
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (err) {
        queue.forEach((p) => p.reject(err))
        queue = []
        doLogout()
        return Promise.reject(err)
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api
