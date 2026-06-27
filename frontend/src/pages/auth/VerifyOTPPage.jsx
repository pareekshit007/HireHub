import { useState, useRef, useEffect } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { authAPI } from '@/api/services'
import { cn } from '@/lib/utils'

export default function VerifyOTPPage() {
  const { login }  = useAuth()
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const location   = useLocation()

  // Fallback to sessionStorage so a page refresh doesn't lose the email
  const email = location.state?.email || sessionStorage.getItem('pendingVerifyEmail') || ''

  const [otp, setOtp]         = useState(['', '', '', '', '', ''])
  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)
  const [countdown, setCountdown] = useState(60)
  const refs = useRef([])

  useEffect(() => {
    if (!email) { navigate('/register'); return }
    refs.current[0]?.focus()
    const timer = setInterval(() => setCountdown((c) => (c > 0 ? c - 1 : 0)), 1000)
    return () => clearInterval(timer)
  }, [])

  const handleChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) {
      refs.current[i - 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    const focusIdx = Math.min(pasted.length, 5)
    refs.current[focusIdx]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // Guard: if email is somehow missing, redirect rather than fire a bad request
    if (!email) { navigate('/register'); return }
    const code = otp.join('')
    if (code.length < 6) { toast({ type: 'error', message: 'Enter all 6 digits' }); return }
    setLoading(true)
    try {
      const { data } = await authAPI.verifyOTP({ email, otp: code })
      // Clean up sessionStorage on success
      sessionStorage.removeItem('pendingVerifyEmail')
      login(data.accessToken, data.user)
      toast({ type: 'success', message: 'Email verified! Welcome to HireHub.' })
      const map = { seeker: '/dashboard', employer: '/employer/jobs', admin: '/admin/dashboard' }
      navigate(map[data.user.role] || '/')
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Invalid OTP' })
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    if (!email) { navigate('/register'); return }
    setResending(true)
    try {
      await authAPI.resendOTP({ email })
      toast({ type: 'success', message: 'New OTP sent to your email!' })
      setCountdown(60)
      setOtp(['', '', '', '', '', ''])
      refs.current[0]?.focus()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to resend' })
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm text-center">

          {/* Icon */}
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <Mail className="h-8 w-8 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Check your email</h2>
          <p className="text-sm text-muted-foreground mb-2">
            We sent a 6-digit code to
          </p>
          <p className="text-sm font-semibold text-foreground mb-8">{email}</p>

          {/* OTP inputs */}
          <form onSubmit={handleSubmit}>
            <div className="flex gap-2 justify-center mb-6" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => (refs.current[i] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className={cn(
                    'w-12 h-14 text-center text-xl font-bold rounded-lg border-2 bg-background text-foreground transition-colors',
                    'focus:outline-none focus:border-primary',
                    digit ? 'border-primary' : 'border-border'
                  )}
                />
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify email'}
            </Button>
          </form>

          {/* Resend */}
          <div className="mt-6">
            {countdown > 0 ? (
              <p className="text-sm text-muted-foreground">
                Resend code in <span className="font-medium text-foreground">{countdown}s</span>
              </p>
            ) : (
              <button
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-primary hover:underline disabled:opacity-50"
              >
                {resending ? 'Sending…' : 'Resend code'}
              </button>
            )}
          </div>

          <p className="text-sm text-muted-foreground mt-4">
            Wrong email?{' '}
            <Link to="/register" className="text-primary hover:underline">Go back</Link>
          </p>
        </div>
      </div>
    </div>
  )
}