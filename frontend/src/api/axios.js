import axios from 'axios'

// ── In-memory token store (never touches localStorage) ────────────────────────
let accessToken = null

export const setAccessToken = (token) => { accessToken = token }
export const getAccessToken = () => accessToken
export const clearAccessToken = () => { accessToken = null }

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
})

// ── Attach access token ───────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

// ── Auto-refresh on 401 ───────────────────────────────────────────────────────
let isRefreshing = false
let failedQueue  = []

const processQueue = (error, token = null) => {
  failedQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token)))
  failedQueue = []
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    const isRefreshCall = original.url?.includes('/auth/refresh')
    if (error.response?.status === 401 && !original._retry && !isRefreshCall) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        })
          .then((token) => {
            original.headers.Authorization = `Bearer ${token}`
            return api(original)
          })
          .catch((err) => Promise.reject(err))
      }

      original._retry = true
      isRefreshing    = true

      try {
        const { data } = await axios.post('/api/auth/refresh', {}, { withCredentials: true })
        const newToken = data.accessToken
        setAccessToken(newToken)
        api.defaults.headers.common.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        clearAccessToken()
        // Only redirect if not already on an auth page
        const onAuthPage = ['/login', '/register'].some((p) => window.location.pathname.startsWith(p))
        if (!onAuthPage) window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(error)
  }
)

export default api