import { useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { authAPI } from '@/api/services'
import { Spinner } from '@/components/ui/Card'

export default function OAuthSuccess() {
  const [params]  = useSearchParams()
  const { login } = useAuth()
  const navigate  = useNavigate()

  useEffect(() => {
    const token = params.get('token')
    const role  = params.get('role')
    if (!token) { navigate('/login'); return }

    localStorage.setItem('accessToken', token)
    authAPI.getMe()
      .then(({ data }) => {
        login(token, data.user)
        const map = { seeker: '/dashboard', employer: '/employer/jobs', admin: '/admin/dashboard' }
        navigate(map[data.user.role] || '/', { replace: true })
      })
      .catch(() => navigate('/login'))
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