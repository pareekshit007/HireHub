import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { authAPI } from '@/api/services'

export default function ForgotPasswordPage() {
  const { toast } = useToast()
  const navigate  = useNavigate()

  const [email, setEmail]     = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent]       = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await authAPI.forgotPassword({ email })
      setSent(true)
      toast({ type: 'success', message: 'OTP sent! Check your email.' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Something went wrong' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <div className="w-full max-w-sm">
        <div className="bg-card rounded-xl border border-border p-8 shadow-sm">

          <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="h-4 w-4" /> Back to login
          </Link>

          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
            <Mail className="h-7 w-7 text-primary" />
          </div>

          {!sent ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-2">Forgot password?</h2>
              <p className="text-sm text-muted-foreground mb-6">
                Enter your email and we'll send you a reset code.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="form-group">
                  <Label htmlFor="email">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending…' : 'Send reset code'}
                </Button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <h2 className="text-2xl font-bold text-foreground mb-2">Code sent!</h2>
              <p className="text-sm text-muted-foreground mb-6">
                We sent a reset code to <strong>{email}</strong>. Check your inbox.
              </p>
              <Button
                className="w-full"
                onClick={() => navigate('/reset-password', { state: { email } })}
              >
                Enter reset code
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}