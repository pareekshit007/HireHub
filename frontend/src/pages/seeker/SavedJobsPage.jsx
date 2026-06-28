import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Bookmark, MapPin, Briefcase, X,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { savedJobAPI } from '@/api/services'
import { cn, formatSalary, timeAgo, JOB_TYPE_COLORS } from '@/lib/utils'

function SavedJobCard({ saved, onRemove }) {
  const navigate  = useNavigate()
  const job = saved.job
  if (!job) return null

  return (
    <div className="bg-card border border-border rounded-xl p-5 card-hover group relative">
      {/* Remove button */}
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(job._id) }}
        className="absolute top-3 right-3 h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
        title="Remove from saved"
      >
        <X className="h-4 w-4" />
      </button>

      <div
        className="flex items-start gap-4 cursor-pointer"
        onClick={() => navigate(`/jobs/${job._id}`)}
      >
        {/* Logo */}
        <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-lg">
          {job.employer?.employerProfile?.logoUrl
            ? <img src={job.employer.employerProfile.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            : (job.employer?.employerProfile?.companyName?.[0] || <Building2 className="h-5 w-5" />)
          }
        </div>

        <div className="flex-1 min-w-0 pr-6">
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {job.title}
          </h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {job.employer?.employerProfile?.companyName || 'Company'}
          </p>

          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
            {job.location && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3 w-3" /> {job.location}
              </span>
            )}
            {job.workMode && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-3 w-3" /> {job.workMode}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm font-medium text-foreground">{formatSalary(job.salary)}</span>
            <div className="flex items-center gap-2">
              <span className={cn('badge', JOB_TYPE_COLORS[job.jobType] || 'badge-gray')}>
                {job.jobType}
              </span>
              <span className="text-xs text-muted-foreground">Saved {timeAgo(saved.createdAt)}</span>
            </div>
          </div>

          {job.skills?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {job.skills.slice(0, 4).map((s) => (
                <span key={s} className="badge badge-gray">{s}</span>
              ))}
              {job.skills.length > 4 && (
                <span className="badge badge-gray">+{job.skills.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-2 mt-4 pt-4 border-t border-border">
        <Button
          size="sm" className="flex-1"
          onClick={() => navigate(`/jobs/${job._id}`)}
        >
          View Job
        </Button>
        <Button
          size="sm" variant="outline" className="flex-1"
          onClick={() => navigate(`/jobs/${job._id}`)}
        >
          Apply Now
        </Button>
      </div>
    </div>
  )
}

export default function SavedJobsPage() {
  const { toast }     = useToast()
  const [saved, setSaved]   = useState([])
  const [total, setTotal]   = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage]     = useState(1)
  const limit      = 9
  const totalPages = Math.ceil(total / limit)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const { data } = await savedJobAPI.getAll({ page, limit })
      setSaved(data.savedJobs || [])
      setTotal(data.total || 0)
    } catch {
      setSaved([])
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => { fetch() }, [fetch])

  const handleRemove = async (jobId) => {
    try {
      await savedJobAPI.remove(jobId)
      toast({ type: 'success', message: 'Removed from saved jobs' })
      setSaved((prev) => prev.filter((s) => s.job?._id !== jobId))
      setTotal((t) => t - 1)
    } catch {
      toast({ type: 'error', message: 'Failed to remove' })
    }
  }

  return (
    <div className="page-container py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Saved Jobs</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? '…' : `${total} job${total !== 1 ? 's' : ''} saved`}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.href = '/jobs'}>
          <Bookmark className="h-4 w-4" /> Browse More
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : saved.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-xl">
          <Bookmark className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-2">No saved jobs yet</h3>
          <p className="text-sm text-muted-foreground mb-6">
            Bookmark jobs you're interested in to revisit them later.
          </p>
          <Button onClick={() => window.location.href = '/jobs'}>Browse Jobs</Button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {saved.map((s) => (
              <SavedJobCard key={s._id} saved={s} onRemove={handleRemove} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}