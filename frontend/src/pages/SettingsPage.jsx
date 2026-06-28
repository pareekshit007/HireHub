import { useState } from 'react'
import {
  Lock, LogOut, Trash2, Shield, Moon, Sun,
  Monitor, AlertTriangle, Eye, EyeOff
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { userAPI, authAPI } from '@/api/services'
import { cn } from '@/lib/utils'

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, description, children, danger }) {
  return (
    <div className={cn(
      'bg-card border rounded-xl overflow-hidden',
      danger ? 'border-destructive/30' : 'border-border'
    )}>
      <div className={cn('px-6 py-4 border-b', danger ? 'border-destructive/20 bg-destructive/5' : 'border-border')}>
        <div className="flex items-center gap-2">
          <Icon className={cn('h-4 w-4', danger ? 'text-destructive' : 'text-primary')} />
          <h2 className={cn('font-semibold', danger ? 'text-destructive' : 'text-foreground')}>{title}</h2>
        </div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Password field with toggle ────────────────────────────────────────────────
function PasswordInput({ label, value, onChange, placeholder }) {
  const [show, setShow] = useState(false)
  return (
    <div className="form-group">
      <Label>{label}</Label>
      <div className="relative">
        <Input
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    </div>
  )
}

// ── Theme selector ────────────────────────────────────────────────────────────
function ThemeOption({ value, label, icon: Icon, current, onClick }) {
  return (
    <button
      onClick={() => onClick(value)}
      className={cn(
        'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all flex-1',
        current === value
          ? 'border-primary bg-primary/5 text-primary'
          : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
      )}
    >
      <Icon className="h-5 w-5" />
      <span className="text-xs font-medium">{label}</span>
    </button>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user, logout } = useAuth()
  const { theme, setTheme } = useTheme()
  const { toast } = useToast()

  // Password change state
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [savingPwd, setSavingPwd] = useState(false)

  // Logout all state
  const [loggingOutAll, setLoggingOutAll] = useState(false)

  // Delete confirm
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [showDelete, setShowDelete]       = useState(false)

  const handlePasswordChange = async () => {
    if (!passwords.current || !passwords.next || !passwords.confirm) {
      toast({ type: 'error', message: 'All password fields are required' }); return
    }
    if (passwords.next.length < 6) {
      toast({ type: 'error', message: 'New password must be at least 6 characters' }); return
    }
    if (passwords.next !== passwords.confirm) {
      toast({ type: 'error', message: 'New passwords do not match' }); return
    }

    setSavingPwd(true)
    try {
      await userAPI.changePassword({ currentPassword: passwords.current, newPassword: passwords.next })
      setPasswords({ current: '', next: '', confirm: '' })
      toast({ type: 'success', message: 'Password changed successfully' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to change password' })
    } finally {
      setSavingPwd(false)
    }
  }

  const handleLogoutAll = async () => {
    if (!confirm('This will log you out of all devices. Continue?')) return
    setLoggingOutAll(true)
    try {
      await authAPI.logoutAll()
      logout()
    } catch {
      toast({ type: 'error', message: 'Failed to logout from all devices' })
      setLoggingOutAll(false)
    }
  }

  const isGoogleUser = user?.authProvider === 'google'

  return (
    <div className="page-container py-8 max-w-2xl">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account preferences and security</p>
      </div>

      <div className="space-y-6">

        {/* Account info */}
        <Section title="Account" icon={Shield} description="Your account details">
          <div className="space-y-3">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Email</p>
                <p className="text-sm text-muted-foreground">{user?.email}</p>
              </div>
              <span className="badge badge-gray text-xs">
                {isGoogleUser ? 'Google' : 'Email'}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm font-medium text-foreground">Role</p>
                <p className="text-sm text-muted-foreground capitalize">{user?.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-foreground">Account Status</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
              <span className="badge badge-green text-xs">Verified</span>
            </div>
          </div>
        </Section>

        {/* Appearance */}
        <Section title="Appearance" icon={Moon} description="Choose how HireHub looks to you">
          <div className="flex gap-3">
            <ThemeOption value="light"  label="Light"  icon={Sun}     current={theme} onClick={setTheme} />
            <ThemeOption value="dark"   label="Dark"   icon={Moon}    current={theme} onClick={setTheme} />
            <ThemeOption value="system" label="System" icon={Monitor}  current={theme} onClick={setTheme} />
          </div>
        </Section>

        {/* Change password */}
        {!isGoogleUser && (
          <Section title="Change Password" icon={Lock} description="Use a strong password you don't use elsewhere">
            <div className="space-y-4">
              <PasswordInput
                label="Current Password"
                value={passwords.current}
                onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                placeholder="Enter current password"
              />
              <PasswordInput
                label="New Password"
                value={passwords.next}
                onChange={(e) => setPasswords({ ...passwords, next: e.target.value })}
                placeholder="Min. 6 characters"
              />
              <PasswordInput
                label="Confirm New Password"
                value={passwords.confirm}
                onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                placeholder="Repeat new password"
              />

              {/* Strength indicator */}
              {passwords.next && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1,2,3,4].map((n) => {
                      const len = passwords.next.length
                      const hasUpper = /[A-Z]/.test(passwords.next)
                      const hasNum   = /\d/.test(passwords.next)
                      const hasSpec  = /[^A-Za-z0-9]/.test(passwords.next)
                      const score = [len >= 8, hasUpper, hasNum, hasSpec].filter(Boolean).length
                      return (
                        <div key={n} className={cn(
                          'h-1 flex-1 rounded-full transition-colors',
                          n <= score
                            ? score <= 1 ? 'bg-red-500' : score <= 2 ? 'bg-yellow-500' : score <= 3 ? 'bg-blue-500' : 'bg-green-500'
                            : 'bg-muted'
                        )} />
                      )
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {(() => {
                      const len = passwords.next.length
                      const score = [len >= 8, /[A-Z]/.test(passwords.next), /\d/.test(passwords.next), /[^A-Za-z0-9]/.test(passwords.next)].filter(Boolean).length
                      return ['', 'Weak', 'Fair', 'Good', 'Strong'][score]
                    })()}
                  </p>
                </div>
              )}

              <Button onClick={handlePasswordChange} disabled={savingPwd} className="w-full">
                {savingPwd ? 'Changing…' : 'Change Password'}
              </Button>
            </div>
          </Section>
        )}

        {isGoogleUser && (
          <Section title="Password" icon={Lock} description="Password management">
            <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
              <Shield className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="text-sm text-muted-foreground">
                Your account uses Google Sign-In. Password management is handled by Google.
              </p>
            </div>
          </Section>
        )}

        {/* Sessions */}
        <Section title="Sessions" icon={LogOut} description="Manage where you're logged in">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div>
                <p className="text-sm font-medium text-foreground">Current session</p>
                <p className="text-xs text-muted-foreground">This device · Active now</p>
              </div>
              <span className="badge badge-green text-xs">Active</span>
            </div>
            <Button
              variant="outline"
              className="w-full gap-2 text-muted-foreground"
              onClick={handleLogoutAll}
              disabled={loggingOutAll}
            >
              <LogOut className="h-4 w-4" />
              {loggingOutAll ? 'Logging out…' : 'Log out of all devices'}
            </Button>
          </div>
        </Section>

        {/* Danger zone */}
        <Section title="Danger Zone" icon={AlertTriangle} danger>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Once you delete your account, all your data including applications, saved jobs, and profile information will be permanently removed. This cannot be undone.
            </p>

            {!showDelete ? (
              <Button
                variant="outline"
                className="gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
                onClick={() => setShowDelete(true)}
              >
                <Trash2 className="h-4 w-4" />
                Delete my account
              </Button>
            ) : (
              <div className="space-y-3 border border-destructive/30 rounded-lg p-4 bg-destructive/5">
                <p className="text-sm font-medium text-destructive">
                  Type <span className="font-mono font-bold">DELETE</span> to confirm
                </p>
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder="DELETE"
                  className="border-destructive/40 focus-visible:ring-destructive"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => { setShowDelete(false); setDeleteConfirm('') }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    disabled={deleteConfirm !== 'DELETE'}
                    onClick={() => toast({ type: 'error', message: 'Account deletion requires admin action. Contact support.' })}
                  >
                    <Trash2 className="h-4 w-4" /> Delete Account
                  </Button>
                </div>
              </div>
            )}
          </div>
        </Section>

      </div>
    </div>
  )
}