import { useState, useEffect, useRef } from 'react'
import {
  User, MapPin, Phone, Globe, Linkedin, Github,
  FileText, Plus, Trash2, Save, Edit2, X,
  CheckCircle, Upload, Briefcase, GraduationCap,
  ExternalLink, ChevronDown, ChevronUp
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { userAPI } from '@/api/services'
import { cn, getInitials, formatDate } from '@/lib/utils'

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({ title, icon: Icon, children, action }) {
  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <h2 className="font-semibold text-foreground">{title}</h2>
        </div>
        {action}
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

// ── Skill tag input ───────────────────────────────────────────────────────────
function SkillsInput({ skills, onChange }) {
  const [input, setInput] = useState('')

  const add = () => {
    const s = input.trim()
    if (s && !skills.includes(s)) onChange([...skills, s])
    setInput('')
  }

  const remove = (skill) => onChange(skills.filter((s) => s !== skill))

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add() } }}
          placeholder="Add a skill (e.g. React, Python)"
          className="flex-1"
        />
        <Button type="button" variant="outline" onClick={add} disabled={!input.trim()}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {skills.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm bg-primary/10 text-primary border border-primary/20">
              {skill}
              <button onClick={() => remove(skill)} className="hover:text-destructive ml-0.5">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Experience entry ──────────────────────────────────────────────────────────
function ExperienceForm({ entry, onChange, onRemove }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-foreground">Experience Entry</p>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="form-group">
          <Label>Job Title *</Label>
          <Input value={entry.title || ''} onChange={(e) => onChange({ ...entry, title: e.target.value })} placeholder="Software Engineer" />
        </div>
        <div className="form-group">
          <Label>Company *</Label>
          <Input value={entry.company || ''} onChange={(e) => onChange({ ...entry, company: e.target.value })} placeholder="Google" />
        </div>
        <div className="form-group">
          <Label>From</Label>
          <Input type="date" value={entry.from ? entry.from.slice(0, 10) : ''} onChange={(e) => onChange({ ...entry, from: e.target.value })} />
        </div>
        <div className="form-group">
          <Label>To</Label>
          <Input type="date" value={entry.to ? entry.to.slice(0, 10) : ''} onChange={(e) => onChange({ ...entry, to: e.target.value })} disabled={entry.current} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={entry.current || false}
          onChange={(e) => onChange({ ...entry, current: e.target.checked, to: e.target.checked ? null : entry.to })}
          className="rounded"
        />
        Currently working here
      </label>
      <div className="form-group">
        <Label>Description</Label>
        <Textarea
          value={entry.desc || ''}
          onChange={(e) => onChange({ ...entry, desc: e.target.value })}
          placeholder="Describe your role and achievements..."
          rows={3}
        />
      </div>
    </div>
  )
}

// ── Education entry ───────────────────────────────────────────────────────────
function EducationForm({ entry, onChange, onRemove }) {
  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-muted/20">
      <div className="flex justify-between items-start">
        <p className="text-sm font-medium text-foreground">Education Entry</p>
        <button onClick={onRemove} className="text-muted-foreground hover:text-destructive transition-colors">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div className="form-group">
          <Label>Degree *</Label>
          <Input value={entry.degree || ''} onChange={(e) => onChange({ ...entry, degree: e.target.value })} placeholder="B.Tech Computer Science" />
        </div>
        <div className="form-group">
          <Label>Institution *</Label>
          <Input value={entry.school || ''} onChange={(e) => onChange({ ...entry, school: e.target.value })} placeholder="Sharda University" />
        </div>
        <div className="form-group">
          <Label>From</Label>
          <Input type="date" value={entry.from ? entry.from.slice(0, 10) : ''} onChange={(e) => onChange({ ...entry, from: e.target.value })} />
        </div>
        <div className="form-group">
          <Label>To</Label>
          <Input type="date" value={entry.to ? entry.to.slice(0, 10) : ''} onChange={(e) => onChange({ ...entry, to: e.target.value })} disabled={entry.current} />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
        <input
          type="checkbox"
          checked={entry.current || false}
          onChange={(e) => onChange({ ...entry, current: e.target.checked, to: e.target.checked ? null : entry.to })}
          className="rounded"
        />
        Currently studying here
      </label>
    </div>
  )
}

// ── Profile completion bar ────────────────────────────────────────────────────
function ProfileCompletion({ user }) {
  const p = user?.seekerProfile
  const checks = [
    { label: 'Name',        done: !!user?.name },
    { label: 'Headline',    done: !!p?.headline },
    { label: 'Bio',         done: !!p?.bio },
    { label: 'Skills',      done: p?.skills?.length > 0 },
    { label: 'Resume',      done: !!p?.resumeUrl },
    { label: 'Experience',  done: p?.experience?.length > 0 },
    { label: 'Education',   done: p?.education?.length > 0 },
    { label: 'Location',    done: !!p?.location },
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
      <div className="grid grid-cols-2 gap-1.5">
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

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const { toast } = useToast()
  const resumeRef = useRef()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [uploadingResume, setUploadingResume] = useState(false)

  // form state
  const [basic, setBasic]     = useState({ name: '', headline: '', bio: '', location: '', phone: '' })
  const [links, setLinks]     = useState({ portfolioUrl: '', linkedinUrl: '', githubUrl: '' })
  const [skills, setSkills]   = useState([])
  const [experience, setExp]  = useState([])
  const [education, setEdu]   = useState([])

  useEffect(() => {
    userAPI.getProfile()
      .then(({ data }) => {
        const u = data.user
        setProfile(u)
        const p = u.seekerProfile || {}
        setBasic({ name: u.name || '', headline: p.headline || '', bio: p.bio || '', location: p.location || '', phone: p.phone || '' })
        setLinks({ portfolioUrl: p.portfolioUrl || '', linkedinUrl: p.linkedinUrl || '', githubUrl: p.githubUrl || '' })
        setSkills(p.skills || [])
        setExp(p.experience || [])
        setEdu(p.education || [])
      })
      .catch(() => toast({ type: 'error', message: 'Failed to load profile' }))
      .finally(() => setLoading(false))
  }, [])

  const saveAll = async () => {
    setSaving(true)
    try {
      const [basicRes, seekerRes] = await Promise.all([
        userAPI.updateProfile({ name: basic.name }),
        userAPI.updateSeekerProfile({
          headline: basic.headline,
          bio:      basic.bio,
          location: basic.location,
          phone:    basic.phone,
          skills,
          experience,
          education,
          ...links,
        }),
      ])
      const updated = seekerRes.data.user
      setProfile(updated)
      updateUser({ name: basic.name })
      toast({ type: 'success', message: 'Profile saved!' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Save failed' })
    } finally {
      setSaving(false)
    }
  }

  const handleResumeUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') { toast({ type: 'error', message: 'Only PDF files allowed' }); return }
    if (file.size > 5 * 1024 * 1024)    { toast({ type: 'error', message: 'File must be under 5MB' }); return }

    setUploadingResume(true)
    const form = new FormData()
    form.append('resume', file)
    try {
      const { data } = await userAPI.uploadResume(form)
      setProfile((prev) => ({ ...prev, seekerProfile: { ...prev.seekerProfile, resumeUrl: data.resumeUrl } }))
      toast({ type: 'success', message: 'Resume uploaded!' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Upload failed' })
    } finally {
      setUploadingResume(false)
      e.target.value = ''
    }
  }

  const addExp = () => setExp((p) => [...p, { title: '', company: '', from: '', to: '', current: false, desc: '' }])
  const addEdu = () => setEdu((p) => [...p, { degree: '', school: '', from: '', to: '', current: false }])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">Keep your profile updated to get the best job matches</p>
        </div>
        <Button onClick={saveAll} disabled={saving} className="gap-2">
          <Save className="h-4 w-4" />
          {saving ? 'Saving…' : 'Save All'}
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left column */}
        <div className="space-y-6">

          {/* Avatar + name */}
          <div className="bg-card border border-border rounded-xl p-6 text-center">
            <div className="h-20 w-20 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center mx-auto text-2xl font-bold text-primary mb-4">
              {profile?.avatar
                ? <img src={profile.avatar} className="h-20 w-20 rounded-full object-cover" alt="" />
                : getInitials(basic.name)
              }
            </div>
            <p className="font-semibold text-foreground">{basic.name || 'Your Name'}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{basic.headline || 'Add a headline'}</p>
            <p className="text-xs text-muted-foreground mt-1">{user?.email}</p>
          </div>

          {/* Profile completion */}
          <ProfileCompletion user={{ ...user, name: basic.name, seekerProfile: { ...profile?.seekerProfile, headline: basic.headline, bio: basic.bio, location: basic.location, skills, experience, education } }} />

          {/* Resume */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-foreground">Resume</h3>
            </div>

            {profile?.seekerProfile?.resumeUrl ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400 shrink-0" />
                  <span className="text-sm text-green-700 dark:text-green-300 flex-1">Resume uploaded</span>
                  <a
                    href={profile.seekerProfile.resumeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-green-600 dark:text-green-400 hover:text-green-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => resumeRef.current?.click()} disabled={uploadingResume}>
                  <Upload className="h-4 w-4" />
                  {uploadingResume ? 'Uploading…' : 'Replace Resume'}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <FileText className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No resume uploaded</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">PDF only, max 5MB</p>
                </div>
                <Button className="w-full gap-2" onClick={() => resumeRef.current?.click()} disabled={uploadingResume}>
                  <Upload className="h-4 w-4" />
                  {uploadingResume ? 'Uploading…' : 'Upload Resume'}
                </Button>
              </div>
            )}
            <input ref={resumeRef} type="file" accept="application/pdf" className="hidden" onChange={handleResumeUpload} />
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Basic info */}
          <Section title="Basic Information" icon={User}>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="form-group sm:col-span-2">
                <Label>Full Name *</Label>
                <Input value={basic.name} onChange={(e) => setBasic({ ...basic, name: e.target.value })} placeholder="Pareekshit Sharma" />
              </div>
              <div className="form-group sm:col-span-2">
                <Label>Professional Headline</Label>
                <Input value={basic.headline} onChange={(e) => setBasic({ ...basic, headline: e.target.value })} placeholder="Full Stack Developer | React · Node.js · MongoDB" />
              </div>
              <div className="form-group sm:col-span-2">
                <Label>Bio</Label>
                <Textarea
                  value={basic.bio}
                  onChange={(e) => setBasic({ ...basic, bio: e.target.value })}
                  placeholder="Tell employers about yourself, your experience, and what you're looking for..."
                  rows={4}
                />
              </div>
              <div className="form-group">
                <Label>Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={basic.location} onChange={(e) => setBasic({ ...basic, location: e.target.value })} placeholder="Greater Noida, India" className="pl-9" />
                </div>
              </div>
              <div className="form-group">
                <Label>Phone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} placeholder="+91 9876543210" className="pl-9" />
                </div>
              </div>
            </div>
          </Section>

          {/* Links */}
          <Section title="Links" icon={Globe}>
            <div className="space-y-3">
              <div className="form-group">
                <Label>Portfolio / Website</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={links.portfolioUrl} onChange={(e) => setLinks({ ...links, portfolioUrl: e.target.value })} placeholder="https://yourportfolio.com" className="pl-9" />
                </div>
              </div>
              <div className="form-group">
                <Label>LinkedIn</Label>
                <div className="relative">
                  <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={links.linkedinUrl} onChange={(e) => setLinks({ ...links, linkedinUrl: e.target.value })} placeholder="https://linkedin.com/in/pareekshit18" className="pl-9" />
                </div>
              </div>
              <div className="form-group">
                <Label>GitHub</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={links.githubUrl} onChange={(e) => setLinks({ ...links, githubUrl: e.target.value })} placeholder="https://github.com/pareekshit007" className="pl-9" />
                </div>
              </div>
            </div>
          </Section>

          {/* Skills */}
          <Section title="Skills" icon={CheckCircle}>
            <SkillsInput skills={skills} onChange={setSkills} />
            {skills.length === 0 && (
              <p className="text-xs text-muted-foreground mt-2">Add skills to help employers find you (e.g. React, Node.js, Java, SQL)</p>
            )}
          </Section>

          {/* Experience */}
          <Section
            title="Experience"
            icon={Briefcase}
            action={
              <Button variant="outline" size="sm" onClick={addExp} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            }
          >
            {experience.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                <Briefcase className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No experience added yet</p>
                <button onClick={addExp} className="text-primary text-sm hover:underline mt-1">+ Add your first experience</button>
              </div>
            ) : (
              <div className="space-y-4">
                {experience.map((entry, i) => (
                  <ExperienceForm
                    key={i}
                    entry={entry}
                    onChange={(updated) => setExp((prev) => prev.map((e, idx) => idx === i ? updated : e))}
                    onRemove={() => setExp((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Education */}
          <Section
            title="Education"
            icon={GraduationCap}
            action={
              <Button variant="outline" size="sm" onClick={addEdu} className="gap-1">
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            }
          >
            {education.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed border-border rounded-lg">
                <GraduationCap className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No education added yet</p>
                <button onClick={addEdu} className="text-primary text-sm hover:underline mt-1">+ Add your education</button>
              </div>
            ) : (
              <div className="space-y-4">
                {education.map((entry, i) => (
                  <EducationForm
                    key={i}
                    entry={entry}
                    onChange={(updated) => setEdu((prev) => prev.map((e, idx) => idx === i ? updated : e))}
                    onRemove={() => setEdu((prev) => prev.filter((_, idx) => idx !== i))}
                  />
                ))}
              </div>
            )}
          </Section>

          {/* Save button at bottom too */}
          <div className="flex justify-end">
            <Button onClick={saveAll} disabled={saving} size="lg" className="gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save Profile'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}