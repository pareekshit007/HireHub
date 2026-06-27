import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Briefcase, Search, Building2 } from 'lucide-react'
import { Button }  from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth }  from '@/context/AuthContext'
import { authAPI }  from '@/api/services'
import { cn }       from '@/lib/utils'

export default function RegisterPage() {
  const { toast }  = useToast()
  const { login }  = useAuth()
  const navigate   = useNavigate()

  const [form, setForm]       = useState({ name: '', email: '', password: '', role: 'seeker' })
  const [showPw, setShowPw]   = useState(false)
  const [loading, setLoading] = useState(false)
  const [errors, setErrors]   = useState({})

  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.password.length < 6) { setErrors({ password: 'Minimum 6 characters' }); return }
    setLoading(true)
    setErrors({})
    try {
      const { data } = await authAPI.register(form)
      // Auto-login with token returned from register
      login(data.accessToken, data.user)
      toast({ type: 'success', message: `Welcome to HireHub, ${data.user.name}!` })
      const map = { seeker: '/dashboard', employer: '/employer/jobs', admin: '/admin/dashboard' }
      navigate(map[data.user.role] || '/')
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed'
      toast({ type: 'error', message: msg })
      if (err.response?.data?.errors) {
        const errs = {}
        err.response.data.errors.forEach(({ field, message }) => { errs[field] = message })
        setErrors(errs)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
          <div className="text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 font-bold text-xl text-primary mb-6">
              <Briefcase className="h-6 w-6" /> HireHub
            </Link>
            <h2 className="text-2xl font-bold text-foreground">Create your account</h2>
            <p className="text-muted-foreground text-sm mt-1">Join thousands of professionals</p>
          </div>

          {/* Role picker */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { role: 'seeker',   label: 'Job Seeker',   Icon: Search,    sub: 'Find your next role' },
              { role: 'employer', label: 'Employer',      Icon: Building2, sub: 'Hire great talent'   },
            ].map(({ role, label, Icon, sub }) => (
              <button
                key={role}
                type="button"
                onClick={() => setForm((p) => ({ ...p, role }))}
                className={cn(
                  'flex flex-col items-center gap-1.5 p-4 rounded-lg border-2 transition-all text-sm',
                  form.role === role
                    ? 'border-primary bg-primary/5 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50'
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
                <span className="text-xs opacity-70">{sub}</span>
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="form-group">
              <Label htmlFor="name">Full name</Label>
              <Input id="name" placeholder="Pareekshit Singh" value={form.name} onChange={set('name')} required />
              {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
            </div>
            <div className="form-group">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={form.email} onChange={set('email')} required />
              {errors.email && <p className="text-xs text-destructive mt-1">{errors.email}</p>}
            </div>
            <div className="form-group">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={set('password')}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && <p className="text-xs text-destructive mt-1">{errors.password}</p>}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account…' : 'Create account'}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}