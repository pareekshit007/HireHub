import { useState, useRef } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { authAPI } from '@/api/services'
import { cn } from '@/lib/utils'

export default function ResetPasswordPage() {
  const { toast } = useToast()
  const navigate  = useNavigate()
  const location  = useLocation()
  const email     = location.state?.email || ''

  const [otp, setOtp]           = useState(['', '', '', '', '', ''])
  const [newPassword, setNewPw] = useState('')
  const [confirmPw, setConfirm] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)
  const refs = useRef([])

  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return
    const next = [...otp]
    next[i] = val
    setOtp(next)
    if (val && i < 5) refs.current[i + 1]?.focus()
  }

  const handleKeyDown = (i, e) => {
    if (e.key === 'Backspace' && !otp[i] && i > 0) refs.current[i - 1]?.focus()
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6)
    const next = [...otp]
    pasted.split('').forEach((ch, i) => { next[i] = ch })
    setOtp(next)
    refs.current[Math.min(pasted.length, 5)]?.focus()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const code = otp.join('')
    if (code.length < 6) { toast({ type: 'error', message: 'Enter the 6-digit OTP' }); return }
    if (newPassword.length < 6) { toast({ type: 'error', message: 'Password must be at least 6 characters' }); return }
    if (newPassword !== confirmPw) { toast({ type: 'error', message: 'Passwords do not match' }); return }

    setLoading(true)
    try {
      await authAPI.resetPassword({ email, otp: code, newPassword })
      toast({ type: 'success', message: 'Password reset! Please sign in.' })
      navigate('/login')
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Reset failed' })
    } finally {
      setLoading(false)
    }
  }

  if (!email) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No email found.</p>
          <Link to="/forgot-password" className="text-primary hover:underline">Go back</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">

          <Link to="/forgot-password" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back
          </Link>

          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <KeyRound className="h-7 w-7 text-primary" />
          </div>

          <h2 className="text-2xl font-bold text-foreground mb-2">Reset password</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Enter the code sent to <strong>{email}</strong> and your new password.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* OTP */}
            <div>
              <Label className="mb-2 block">Reset code</Label>
              <div className="flex gap-2" onPaste={handlePaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => (refs.current[i] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    className={cn(
                      'w-10 h-12 text-center text-lg font-bold rounded-lg border-2 bg-background text-foreground transition-colors focus:outline-none focus:border-primary',
                      digit ? 'border-primary' : 'border-border'
                    )}
                  />
                ))}
              </div>
            </div>

            {/* New password */}
            <div className="form-group">
              <Label htmlFor="newPw">New password</Label>
              <div className="relative">
                <Input
                  id="newPw"
                  type={showPw ? 'text' : 'password'}
                  placeholder="Min 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPw(e.target.value)}
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
            </div>

            {/* Confirm password */}
            <div className="form-group">
              <Label htmlFor="confirmPw">Confirm password</Label>
              <Input
                id="confirmPw"
                type="password"
                placeholder="Repeat your password"
                value={confirmPw}
                onChange={(e) => setConfirm(e.target.value)}
                required
              />
              {confirmPw && newPassword !== confirmPw && (
                <p className="text-xs text-destructive mt-1">Passwords do not match</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Resetting…' : 'Reset password'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}