import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, X, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea, Label } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { jobAPI } from '@/api/services'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Marketing',
  'Design', 'Sales', 'Operations', 'HR', 'Legal', 'Engineering',
  'Customer Support', 'Data Science', 'Product', 'Other',
]
const JOB_TYPES       = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
const WORK_MODES      = ['On-site', 'Remote', 'Hybrid']
const EXP_LEVELS      = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive']

const EMPTY = {
  title: '', description: '', requirements: '', responsibilities: '',
  category: '', jobType: 'Full-time', workMode: 'On-site', experienceLevel: 'Mid',
  location: '', openings: 1, deadline: '',
  salary: { min: '', max: '', currency: 'INR', isHidden: false },
  skills: [],
}

function SelectField({ label, name, value, onChange, options, required }) {
  return (
    <div className="form-group">
      <Label htmlFor={name}>{label}{required && <span className="text-destructive ml-0.5">*</span>}</Label>
      <select
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm',
          'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          'focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
        )}
      >
        <option value="">Select…</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  )
}

export default function PostJobPage() {
  const { id }       = useParams()          // present when editing
  const isEdit       = Boolean(id)
  const navigate     = useNavigate()
  const { toast }    = useToast()

  const [form, setForm]       = useState(EMPTY)
  const [skillInput, setSkillInput] = useState('')
  const [loading, setLoading] = useState(isEdit)
  const [saving, setSaving]   = useState(false)
  const [errors, setErrors]   = useState({})

  // Load job data when editing
  useEffect(() => {
    if (!isEdit) return
    jobAPI.getJobById(id)
      .then(({ data }) => {
        const j = data.job
        setForm({
          title:            j.title || '',
          description:      j.description || '',
          requirements:     j.requirements || '',
          responsibilities: j.responsibilities || '',
          category:         j.category || '',
          jobType:          j.jobType || 'Full-time',
          workMode:         j.workMode || 'On-site',
          experienceLevel:  j.experienceLevel || 'Mid',
          location:         j.location || '',
          openings:         j.openings || 1,
          deadline:         j.deadline ? j.deadline.slice(0, 10) : '',
          salary: {
            min:      j.salary?.min || '',
            max:      j.salary?.max || '',
            currency: j.salary?.currency || 'INR',
            isHidden: j.salary?.isHidden || false,
          },
          skills: j.skills || [],
        })
      })
      .catch(() => toast({ type: 'error', message: 'Failed to load job' }))
      .finally(() => setLoading(false))
  }, [id, isEdit])

  const set = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, [field]: val }))
    if (errors[field]) setErrors((e) => ({ ...e, [field]: '' }))
  }

  const setSalary = (field) => (e) => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setForm((f) => ({ ...f, salary: { ...f.salary, [field]: val } }))
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (!s || form.skills.includes(s)) return
    setForm((f) => ({ ...f, skills: [...f.skills, s] }))
    setSkillInput('')
  }

  const removeSkill = (s) =>
    setForm((f) => ({ ...f, skills: f.skills.filter((sk) => sk !== s) }))

  const validate = () => {
    const e = {}
    if (!form.title.trim())       e.title = 'Title is required'
    if (!form.category)           e.category = 'Category is required'
    if (form.description.length < 50) e.description = 'Description must be at least 50 characters'
    return e
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length) { setErrors(errs); return }

    setSaving(true)
    const payload = {
      ...form,
      openings: Number(form.openings) || 1,
      salary: {
        ...form.salary,
        min: Number(form.salary.min) || 0,
        max: Number(form.salary.max) || 0,
      },
      deadline: form.deadline || undefined,
    }

    try {
      if (isEdit) {
        await jobAPI.updateJob(id, payload)
        toast({ type: 'success', message: 'Job updated — pending re-approval' })
      } else {
        await jobAPI.createJob(payload)
        toast({ type: 'success', message: 'Job submitted for review!' })
      }
      navigate('/employer/jobs')
    } catch (err) {
      const msg = err.response?.data?.message || 'Something went wrong'
      toast({ type: 'error', message: msg })
      // surface field-level errors from backend
      const backendErrors = err.response?.data?.errors
      if (backendErrors) {
        const fe = {}
        backendErrors.forEach(({ field, message }) => { fe[field] = message })
        setErrors(fe)
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate('/employer/jobs')}
          className="h-9 w-9 flex items-center justify-center rounded-md border border-border hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEdit ? 'Edit Job Listing' : 'Post a New Job'}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEdit ? 'Changes will be sent for admin review.' : 'Fill in the details below — your listing goes live after admin approval.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8 max-w-3xl">

        {/* ── Basic Info ─────────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Basic Information</h2>

          <div className="form-group">
            <Label htmlFor="title">Job Title <span className="text-destructive">*</span></Label>
            <Input
              id="title"
              placeholder="e.g. Senior React Developer"
              value={form.title}
              onChange={set('title')}
              className={errors.title ? 'border-destructive' : ''}
            />
            {errors.title && <p className="text-xs text-destructive">{errors.title}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Category" name="category" value={form.category} onChange={set('category')} options={CATEGORIES} required />
            <SelectField label="Job Type" name="jobType" value={form.jobType} onChange={set('jobType')} options={JOB_TYPES} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectField label="Work Mode" name="workMode" value={form.workMode} onChange={set('workMode')} options={WORK_MODES} />
            <SelectField label="Experience Level" name="experienceLevel" value={form.experienceLevel} onChange={set('experienceLevel')} options={EXP_LEVELS} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group">
              <Label htmlFor="location">Location</Label>
              <Input id="location" placeholder="e.g. Bengaluru / Remote" value={form.location} onChange={set('location')} />
            </div>
            <div className="form-group">
              <Label htmlFor="openings">No. of Openings</Label>
              <Input id="openings" type="number" min="1" value={form.openings} onChange={set('openings')} />
            </div>
          </div>

          <div className="form-group">
            <Label htmlFor="deadline">Application Deadline</Label>
            <Input id="deadline" type="date" value={form.deadline} onChange={set('deadline')} />
          </div>
        </section>

        {/* ── Salary ─────────────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-foreground">Salary</h2>
            <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
              <input
                type="checkbox"
                checked={form.salary.isHidden}
                onChange={setSalary('isHidden')}
                className="rounded"
              />
              Hide salary
            </label>
          </div>

          {!form.salary.isHidden && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group">
                <Label htmlFor="salaryMin">Minimum (₹)</Label>
                <Input
                  id="salaryMin" type="number" placeholder="e.g. 500000"
                  value={form.salary.min}
                  onChange={setSalary('min')}
                />
              </div>
              <div className="form-group">
                <Label htmlFor="salaryMax">Maximum (₹)</Label>
                <Input
                  id="salaryMax" type="number" placeholder="e.g. 1200000"
                  value={form.salary.max}
                  onChange={setSalary('max')}
                />
              </div>
            </div>
          )}
          {form.salary.isHidden && (
            <p className="text-sm text-muted-foreground">Salary will show as "Not disclosed" to applicants.</p>
          )}
        </section>

        {/* ── Skills ─────────────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h2 className="font-semibold text-foreground">Required Skills</h2>
          <div className="flex gap-2">
            <Input
              placeholder="Add a skill (e.g. React, Node.js)"
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
            />
            <Button type="button" variant="outline" onClick={addSkill}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {form.skills.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {form.skills.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium"
                >
                  {s}
                  <button type="button" onClick={() => removeSkill(s)} className="hover:text-destructive transition-colors">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </section>

        {/* ── Description ────────────────────────────────── */}
        <section className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-foreground">Job Details</h2>

          <div className="form-group">
            <Label htmlFor="description">
              Description <span className="text-destructive">*</span>
              <span className="ml-2 text-xs font-normal text-muted-foreground">
                ({form.description.length} chars, min 50)
              </span>
            </Label>
            <Textarea
              id="description"
              rows={6}
              placeholder="Describe the role, team, and what a typical day looks like…"
              value={form.description}
              onChange={set('description')}
              className={cn('resize-y', errors.description ? 'border-destructive' : '')}
            />
            {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
          </div>

          <div className="form-group">
            <Label htmlFor="requirements">Requirements</Label>
            <Textarea
              id="requirements"
              rows={4}
              placeholder="List qualifications, experience, or certifications required…"
              value={form.requirements}
              onChange={set('requirements')}
              className="resize-y"
            />
          </div>

          <div className="form-group">
            <Label htmlFor="responsibilities">Responsibilities</Label>
            <Textarea
              id="responsibilities"
              rows={4}
              placeholder="List the day-to-day responsibilities of this role…"
              value={form.responsibilities}
              onChange={set('responsibilities')}
              className="resize-y"
            />
          </div>
        </section>

        {/* ── Submit ─────────────────────────────────────── */}
        <div className="flex gap-3">
          <Button type="submit" disabled={saving} className="min-w-[140px]">
            {saving ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {isEdit ? 'Saving…' : 'Submitting…'}</>
            ) : (
              isEdit ? 'Save Changes' : 'Submit for Review'
            )}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate('/employer/jobs')}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  )
}