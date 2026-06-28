import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authAPI } from '@/api/services'
import { setAccessToken } from '@/api/axios'
import { Spinner } from '@/components/ui/Card'

// Reads a cookie by name and deletes it immediately after
const consumeCookie = (name) => {
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'))
  if (!match) return null
  const value = decodeURIComponent(match[1])
  // Delete it immediately — it's a one-time handoff token
  document.cookie = `${name}=; Max-Age=0; path=/`
  return value
}

export default function OAuthSuccess() {
  const { login } = useAuth()
  const navigate  = useNavigate()

  useEffect(() => {
    const token = consumeCookie('oauthAccessToken')
    if (!token) { navigate('/login?error=oauth_failed'); return }

    setAccessToken(token)
    authAPI.getMe()
      .then(({ data }) => {
        login(token, data.user)
        const map = { seeker: '/dashboard', employer: '/employer/jobs', admin: '/admin/dashboard' }
        navigate(map[data.user.role] || '/', { replace: true })
      })
      .catch(() => navigate('/login?error=oauth_failed'))
  }, [])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Spinner size="lg" className="mx-auto mb-4" />
        <p className="text-muted-foreground text-sm">Signing you in…</p>
      </div>
    </div>
  )
}