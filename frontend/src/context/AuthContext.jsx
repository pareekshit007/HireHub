import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '@/api/services'
import { setAccessToken, clearAccessToken } from '@/api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // On mount, try to get a new access token using the httpOnly refresh cookie.
    // If the cookie is missing or expired, this will 401 and we stay logged out.
    authAPI.refresh()
      .then(({ data }) => {
        setAccessToken(data.accessToken)
        return authAPI.getMe()
      })
      .then(({ data }) => setUser(data.user))
      .catch(() => {
        clearAccessToken()
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((accessToken, userData) => {
    setAccessToken(accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch (_) {}
    clearAccessToken()
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : prev)
  }, []  )

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}

export default AuthContext