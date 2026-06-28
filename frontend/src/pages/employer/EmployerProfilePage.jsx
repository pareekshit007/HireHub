import { useState, useEffect, useRef } from 'react'
import {
  Building2, Globe, MapPin, Users, Briefcase,
  Save, Upload, CheckCircle, ExternalLink, Info
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { userAPI } from '@/api/services'
import { cn, getInitials } from '@/lib/utils'

const COMPANY_SIZES   = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+']
const INDUSTRIES      = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'E-commerce',
  'Manufacturing', 'Media', 'Real Estate', 'Consulting', 'Retail',
  'Logistics', 'Gaming', 'Legal', 'Non-profit', 'Other',
]

function SelectField({ label, value, onChange, options, placeholder }) {
  return (
    <div className="form-group">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'
        )}
      >
        <option value="">{placeholder || 'Select…'}</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}

function ProfileStrength({ profile, user }) {
  const checks = [
    { label: 'Company name',    done: !!profile.companyName },
    { label: 'Industry',        done: !!profile.industry },
    { label: 'Company size',    done: !!profile.companySize },
    { label: 'Location',        done: !!profile.location },
    { label: 'Description',     done: !!profile.description },
    { label: 'Website',         done: !!profile.companyWebsite },
    { label: 'Logo',            done: !!profile.logoUrl },
  ]
  const done  = checks.filter((c) => c.done).length
  const score = Math.round((done / checks.length) * 100)

  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-foreground">Profile Strength</h3>
        <span className={cn('text-lg font-bold', score === 100 ? 'text-green-500' : score >= 60 ? 'text-primary' : 'text-yellow-500')}>
          {score}%
        </span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-4">
        <div
          className={cn('h-full rounded-full transition-all duration-700', score === 100 ? 'bg-green-500' : 'bg-primary')}
          style={{ width: `${score}%` }}
        />
      </div>
      <div className="space-y-1.5">
        {checks.map((c) => (
          <div key={c.label} className="flex items-center gap-2 text-xs">
            <div className={cn('h-3.5 w-3.5 rounded-full flex items-center justify-center shrink-0', c.done ? 'bg-green-500' : 'bg-muted border border-border')}>
              {c.done && <CheckCircle className="h-3 w-3 text-white" />}
            </div>
            <span className={cn(c.done ? 'text-foreground' : 'text-muted-foreground')}>{c.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function EmployerProfilePage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const logoRef = useRef()

  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [profile,       setProfile]       = useState(null)

  const [form, setForm] = useState({
    companyName:    '',
    companyWebsite: '',
    companySize:    '',
    industry:       '',
    description:    '',
    location:       '',
  })

  useEffect(() => {
    userAPI.getProfile()
      .then(({ data }) => {
        const u = data.user
        setProfile(u)
        const p = u.employerProfile || {}
        setForm({
          companyName:    p.companyName    || '',
          companyWebsite: p.companyWebsite || '',
          companySize:    p.companySize    || '',
          industry:       p.industry       || '',
          description:    p.description   || '',
          location:       p.location       || '',
        })
      })
      .catch(() => toast({ type: 'error', message: 'Failed to load profile' }))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!form.companyName.trim()) {
      toast({ type: 'error', message: 'Company name is required' }); return
    }
    setSaving(true)
    try {
      const { data } = await userAPI.updateEmployerProfile(form)
      setProfile(data.user)
      updateUser({ employerProfile: data.user.employerProfile })
      toast({ type: 'success', message: 'Profile saved!' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast({ type: 'error', message: 'Only JPG, PNG, or WebP allowed' }); return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast({ type: 'error', message: 'Image must be under 2MB' }); return
    }

    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('logo', file)
    try {
      const { data } = await userAPI.uploadLogo(fd)
      setProfile((prev) => ({
        ...prev,
        employerProfile: { ...prev.employerProfile, logoUrl: data.logoUrl },
      }))
      toast({ type: 'success', message: 'Logo uploaded!' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Upload failed' })
    } finally {
      setUploadingLogo(false)
      e.target.value = ''
    }
  }

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target?.value ?? e }))

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const logoUrl = profile?.employerProfile?.logoUrl

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Company Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">A complete profile attracts better candidates</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save Profile'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="space-y-6">

          {/* Logo + company name preview */}
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="h-20 w-20 rounded-xl border-2 border-border flex items-center justify-center mx-auto mb-4 overflow-hidden bg-muted">
              {logoUrl
                ? <img src={logoUrl} alt="Logo" className="h-20 w-20 object-cover" />
                : <Building2 className="h-8 w-8 text-muted-foreground/40" />
              }
            </div>
            <p className="font-semibold text-foreground">{form.companyName || 'Your Company'}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{form.industry || 'Industry'}</p>
            {form.location && <p className="text-xs text-muted-foreground mt-1 flex items-center justify-center gap-1"><MapPin className="h-3 w-3" />{form.location}</p>}

            <div className="mt-4 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full gap-2"
                onClick={() => logoRef.current?.click()}
                disabled={uploadingLogo}
              >
                <Upload className="h-4 w-4" />
                {uploadingLogo ? 'Uploading…' : logoUrl ? 'Change Logo' : 'Upload Logo'}
              </Button>
              {logoUrl && (
                <a href={logoUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-1 text-xs text-primary hover:underline">
                  <ExternalLink className="h-3 w-3" /> View current logo
                </a>
              )}
            </div>
            <input ref={logoRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleLogoUpload} />
            <p className="text-xs text-muted-foreground mt-2">JPG, PNG or WebP · Max 2MB</p>
          </div>

          {/* Profile strength */}
          <ProfileStrength profile={{ ...form, logoUrl }} user={user} />

          {/* Tips */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
              <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p className="font-medium">Tips for a great profile</p>
                <p>• Upload a clear company logo</p>
                <p>• Write a detailed description</p>
                <p>• Add your website for credibility</p>
                <p>• Specify company size and industry</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              <Building2 className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Company Information</h2>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <div className="form-group sm:col-span-2">
                <Label>Company Name *</Label>
                <Input value={form.companyName} onChange={set('companyName')} placeholder="Acme Corp" />
              </div>
              <SelectField
                label="Industry"
                value={form.industry}
                onChange={set('industry')}
                options={INDUSTRIES}
                placeholder="Select industry"
              />
              <SelectField
                label="Company Size"
                value={form.companySize}
                onChange={set('companySize')}
                options={COMPANY_SIZES}
                placeholder="Select size"
              />
              <div className="form-group sm:col-span-2">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.location} onChange={set('location')} placeholder="Mumbai, India" className="pl-9" />
                </div>
              </div>
              <div className="form-group sm:col-span-2">
                <Label>Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={form.companyWebsite} onChange={set('companyWebsite')} placeholder="https://yourcompany.com" className="pl-9" />
                </div>
              </div>
              <div className="form-group sm:col-span-2">
                <Label>Company Description</Label>
                <Textarea
                  value={form.description}
                  onChange={set('description')}
                  placeholder="Tell candidates about your company, culture, mission, and what makes you a great place to work..."
                  rows={5}
                />
                <p className="text-xs text-muted-foreground mt-1">{form.description.length} characters</p>
              </div>
            </div>
          </div>

          {/* Account info */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="flex items-center gap-2 px-6 py-4 border-b border-border">
              <Briefcase className="h-4 w-4 text-primary" />
              <h2 className="font-semibold text-foreground">Account</h2>
            </div>
            <div className="p-6 space-y-3">
              <div className="flex items-center justify-between py-2 border-b border-border">
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">{user?.email}</p>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm text-muted-foreground">Account type</p>
                <span className="badge badge-blue">Employer</span>
              </div>
            </div>
          </div>

          {/* Save at bottom */}
          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}