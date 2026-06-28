import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  MapPin, Briefcase, Clock, Users, DollarSign, Calendar,
  Bookmark, BookmarkCheck, Share2, ArrowLeft, Building2,
  CheckCircle, AlertCircle, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, Spinner } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { jobAPI, savedJobAPI, applicationAPI } from '@/api/services'
import { cn, formatSalary, formatDate, timeAgo, JOB_TYPE_COLORS } from '@/lib/utils'

export default function JobDetailPage() {
  const { id }        = useParams()
  const navigate      = useNavigate()
  const { toast }     = useToast()
  const { user, isAuthenticated } = useAuth()

  const [job, setJob]         = useState(null)
  const [loading, setLoading] = useState(true)
  const [saved, setSaved]     = useState(false)
  const [applied, setApplied] = useState(false)
  const [applying, setApplying]   = useState(false)
  const [savingJob, setSavingJob] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await jobAPI.getJobById(id)
        setJob(data.job)

        if (isAuthenticated) {
          // Check if saved
          try {
            const s = await savedJobAPI.check(id)
            setSaved(s.data.isSaved)
          } catch {}

          // Check if already applied
          if (user?.role === 'seeker') {
            try {
              const apps = await applicationAPI.getMyApplications({ jobId: id })
              setApplied((apps.data.applications || []).length > 0)
            } catch {}
          }
        }
      } catch {
        toast({ type: 'error', message: 'Job not found' })
        navigate('/jobs')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, isAuthenticated])

  const handleSave = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    setSavingJob(true)
    try {
      await savedJobAPI.toggle(id)
      setSaved((s) => !s)
      toast({ type: 'success', message: saved ? 'Job removed from saved' : 'Job saved!' })
    } catch {
      toast({ type: 'error', message: 'Failed to save job' })
    } finally {
      setSavingJob(false)
    }
  }

  const handleApply = async () => {
    if (!isAuthenticated) { navigate('/login'); return }
    if (user?.role !== 'seeker') {
      toast({ type: 'error', message: 'Only job seekers can apply' }); return
    }
    setApplying(true)
    try {
      const form = new FormData()
      form.append('coverLetter', '')
      await applicationAPI.apply(id, form)
      setApplied(true)
      toast({ type: 'success', message: 'Application submitted!' })
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to apply' })
    } finally {
      setApplying(false)
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast({ type: 'success', message: 'Link copied to clipboard!' })
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    )
  }

  if (!job) return null

  const isExpired   = job.deadline && new Date(job.deadline) < new Date()
  const isClosed    = job.status === 'closed'
  const canApply    = isAuthenticated && user?.role === 'seeker' && !applied && !isExpired && !isClosed
  const employer    = job.employer?.employerProfile

  return (
    <div className="page-container py-8">

      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to jobs
      </button>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* ── Main content ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Job header */}
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 text-2xl font-bold text-primary">
                {employer?.logoUrl
                  ? <img src={employer.logoUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                  : (employer?.companyName?.[0] || <Building2 className="h-7 w-7" />)
                }
              </div>

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-foreground">{job.title}</h1>
                <p className="text-muted-foreground mt-1">
                  {employer?.companyName || 'Company'} •{' '}
                  <span className="text-xs">{timeAgo(job.createdAt)}</span>
                </p>

                <div className="flex flex-wrap gap-2 mt-3">
                  <span className={cn('badge', JOB_TYPE_COLORS[job.jobType] || 'badge-gray')}>{job.jobType}</span>
                  {job.workMode && <span className="badge badge-blue">{job.workMode}</span>}
                  {job.experienceLevel && <span className="badge badge-purple">{job.experienceLevel} level</span>}
                  {isClosed  && <span className="badge badge-red">Closed</span>}
                  {isExpired && !isClosed && <span className="badge badge-red">Expired</span>}
                </div>
              </div>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
              {[
                { icon: MapPin,     label: 'Location',   value: job.location || 'Not specified' },
                { icon: DollarSign, label: 'Salary',     value: formatSalary(job.salary) },
                { icon: Users,      label: 'Openings',   value: `${job.openings || 1} position${(job.openings || 1) > 1 ? 's' : ''}` },
                { icon: Calendar,   label: 'Deadline',   value: job.deadline ? formatDate(job.deadline) : 'Open' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="text-center">
                  <div className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-muted mb-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 mt-6">
              {applied ? (
                <Button className="flex-1" disabled>
                  <CheckCircle className="h-4 w-4" /> Applied
                </Button>
              ) : canApply ? (
                <Button className="flex-1" onClick={handleApply} disabled={applying}>
                  {applying ? 'Submitting…' : 'Apply Now'}
                </Button>
              ) : !isAuthenticated ? (
                <Button className="flex-1" onClick={() => navigate('/login')}>
                  Sign in to Apply
                </Button>
              ) : (isClosed || isExpired) ? (
                <Button className="flex-1" disabled>
                  <AlertCircle className="h-4 w-4" /> {isClosed ? 'Position Closed' : 'Application Deadline Passed'}
                </Button>
              ) : null}

              <Button variant="outline" size="icon" onClick={handleSave} disabled={savingJob} title="Save job">
                {saved ? <BookmarkCheck className="h-4 w-4 text-primary" /> : <Bookmark className="h-4 w-4" />}
              </Button>
              <Button variant="outline" size="icon" onClick={handleShare} title="Share">
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Description */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h2 className="text-lg font-semibold text-foreground mb-4">Job Description</h2>
            <div className="prose prose-sm max-w-none text-foreground dark:prose-invert">
              <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
            </div>
          </div>

          {/* Requirements */}
          {job.requirements?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Requirements</h2>
              <ul className="space-y-2">
                {job.requirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">Required Skills</h2>
              <div className="flex flex-wrap gap-2">
                {job.skills.map((s) => (
                  <span key={s} className="badge badge-blue">{s}</span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Sidebar ──────────────────────────────────────── */}
        <div className="space-y-4">

          {/* Company info */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">About the Company</h3>
            <div className="space-y-3 text-sm">
              {employer?.companyName && (
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-foreground font-medium">{employer.companyName}</span>
                </div>
              )}
              {employer?.industry && (
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{employer.industry}</span>
                </div>
              )}
              {employer?.companySize && (
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{employer.companySize} employees</span>
                </div>
              )}
              {employer?.location && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">{employer.location}</span>
                </div>
              )}
              {employer?.description && (
                <p className="text-muted-foreground text-xs leading-relaxed mt-3 border-t border-border pt-3">
                  {employer.description}
                </p>
              )}
              {employer?.companyWebsite && (
                <a
                  href={employer.companyWebsite}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline text-xs mt-2"
                >
                  Visit website <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>

          {/* Job overview */}
          <div className="bg-card border border-border rounded-xl p-5">
            <h3 className="font-semibold text-foreground mb-4">Job Overview</h3>
            <div className="space-y-3 text-sm">
              {[
                { label: 'Category',   value: job.category },
                { label: 'Job Type',   value: job.jobType  },
                { label: 'Work Mode',  value: job.workMode },
                { label: 'Experience', value: job.experienceLevel && `${job.experienceLevel} level` },
                { label: 'Posted',     value: timeAgo(job.createdAt) },
              ].filter((r) => r.value).map(({ label, value }) => (
                <div key={label} className="flex justify-between">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="text-foreground font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Apply CTA box */}
          {!applied && canApply && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-center">
              <p className="text-sm text-foreground font-medium mb-3">Interested in this role?</p>
              <Button className="w-full" onClick={handleApply} disabled={applying}>
                {applying ? 'Submitting…' : 'Apply Now'}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}