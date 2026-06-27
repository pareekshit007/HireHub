import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Briefcase } from 'lucide-react'
import { Button }  from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth }  from '@/context/AuthContext'
import { authAPI }  from '@/api/services'

export default function LoginPage() {
  const { login }  = useAuth()
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const location   = useLocation()
  const from       = location.state?.from?.pathname

  const [form, setForm]       = useState({ email: '', password: '' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const redirectAfterLogin = (role) => {
    const map = { seeker: '/dashboard', employer: '/employer/jobs', admin: '/admin/dashboard' }
    navigate(from || map[role] || '/', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { data } = await authAPI.login(form)
      login(data.accessToken, data.user)
      toast({ type: 'success', message: `Welcome back, ${data.user.name.split(' ')[0]}!` })
      redirectAfterLogin(data.user.role)
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed'
      if (msg.toLowerCase().includes('not verified')) {
        toast({ type: 'warning', message: 'Please verify your email first.' })
        navigate('/verify-otp', { state: { email: form.email } })
      } else {
        toast({ type: 'error', message: msg })
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogle = () => {
    window.location.href = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/auth/google`
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-blue-800 flex-col justify-between p-12 text-white">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Briefcase className="h-6 w-6" /> HireHub
        </Link>
        <div>
          <h1 className="text-4xl font-bold leading-tight mb-4">Your next opportunity is waiting</h1>
          <p className="text-blue-200 text-lg">Connect with top employers and land your dream role.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[['50K+','Active Jobs'],['10K+','Companies'],['200K+','Seekers'],['95%','Success Rate']].map(([n, l]) => (
            <div key={l} className="bg-white/10 rounded-xl p-4">
              <p className="text-2xl font-bold">{n}</p>
              <p className="text-blue-200 text-sm">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-4 py-12 bg-background">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2 text-xl font-bold text-primary mb-8">
            <Briefcase className="h-6 w-6" /> HireHub
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-1">Welcome back</h2>
          <p className="text-muted-foreground text-sm mb-8">Sign in to your account</p>

          {/* Google */}
          <button
            type="button"
            onClick={handleGoogle}
            className="w-full h-10 flex items-center justify-center gap-3 rounded-md border border-input bg-background hover:bg-muted text-sm font-medium text-foreground transition-colors mb-6"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continue with Google
          </button>

          <div className="relative mb-6">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
            <div className="relative flex justify-center"><span className="bg-background px-3 text-xs text-muted-foreground">or continue with email</span></div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required autoComplete="email" />
            </div>
            <div className="form-group">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link to="/forgot-password" className="text-xs text-primary hover:underline">Forgot password?</Link>
              </div>
              <div className="relative">
                <Input id="password" type={showPw ? 'text' : 'password'} placeholder="••••••••" value={form.password} onChange={set('password')} required autoComplete="current-password" className="pr-10" />
                <button type="button" onClick={() => setShowPw((s) => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary font-medium hover:underline">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}