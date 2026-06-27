import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { authAPI } from '@/api/services'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) { setLoading(false); return }

    authAPI.getMe()
      .then(({ data }) => setUser(data.user))
      .catch(() => localStorage.removeItem('accessToken'))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback((accessToken, userData) => {
    localStorage.setItem('accessToken', accessToken)
    setUser(userData)
  }, [])

  const logout = useCallback(async () => {
    try { await authAPI.logout() } catch (_) {}
    localStorage.removeItem('accessToken')
    setUser(null)
  }, [])

  const updateUser = useCallback((updates) => {
    setUser((prev) => prev ? { ...prev, ...updates } : prev)
  }, [])

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