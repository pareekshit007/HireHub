import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Plus, Briefcase, Eye, Edit, Trash2, X,
  MapPin, Users, Clock, ChevronLeft, ChevronRight,
  ToggleLeft, ToggleRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner, Badge } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { jobAPI } from '@/api/services'
import { cn, timeAgo, formatDate, formatSalary, STATUS_COLORS } from '@/lib/utils'

const STATUSES = ['all', 'pending', 'active', 'closed', 'rejected']

function JobCard({ job, onDelete, onClose }) {
  const navigate = useNavigate()

  const statusLabel = {
    pending:  'Pending Review',
    active:   'Active',
    closed:   'Closed',
    rejected: 'Rejected',
  }

  return (
    <div className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-all duration-200">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              <Link
                to={`/jobs/${job._id}`}
                className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
              >
                {job.title}
              </Link>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
                {job.location && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" /> {job.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Posted {timeAgo(job.createdAt)}
                </span>
                {job.deadline && (
                  <span className="flex items-center gap-1">
                    Deadline: {formatDate(job.deadline)}
                  </span>
                )}
              </div>
            </div>

            <span className={cn('badge shrink-0', STATUS_COLORS[job.status])}>
              {statusLabel[job.status] || job.status}
            </span>
          </div>

          {/* Badges row */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="badge badge-blue">{job.jobType}</span>
            <span className="badge badge-purple">{job.workMode}</span>
            <span className="badge badge-gray">{job.category}</span>
            {job.experienceLevel && (
              <span className="badge badge-yellow">{job.experienceLevel}</span>
            )}
            {!job.salary?.isHidden && (
              <span className="badge badge-green">{formatSalary(job.salary)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Stats + actions */}
      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Users className="h-4 w-4" />
            <span className="font-medium text-foreground">{job.applicationCount ?? 0}</span> applications
          </span>
          <span className="flex items-center gap-1.5">
            <Eye className="h-4 w-4" />
            <span className="font-medium text-foreground">{job.views ?? 0}</span> views
          </span>
          <span>
            <span className="font-medium text-foreground">{job.openings}</span> opening{job.openings !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-1">
          {job.status === 'active' && (
            <Link to={`/employer/applications?jobId=${job._id}`}>
              <Button variant="ghost" size="icon" title="View applications">
                <Users className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link to={`/jobs/${job._id}`}>
            <Button variant="ghost" size="icon" title="Preview">
              <Eye className="h-4 w-4" />
            </Button>
          </Link>
          {job.status !== 'closed' && (
            <Link to={`/employer/jobs/${job._id}/edit`}>
              <Button variant="ghost" size="icon" title="Edit">
                <Edit className="h-4 w-4" />
              </Button>
            </Link>
          )}
          {job.status === 'active' && (
            <Button
              variant="ghost" size="icon"
              title="Close job"
              className="text-muted-foreground hover:text-orange-500"
              onClick={() => onClose(job._id, job.title)}
            >
              <ToggleRight className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="ghost" size="icon"
            title="Delete"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(job._id, job.title)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

export default function MyJobsPage() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const [jobs, setJobs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('all')
  const [page, setPage]       = useState(1)
  const limit = 8
  const totalPages = Math.ceil(total / limit)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status
      const { data } = await jobAPI.getMyJobs(params)
      setJobs(data.jobs || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { load() }, [load])

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This will also remove all applications.`)) return
    try {
      await jobAPI.deleteJob(id)
      toast({ type: 'success', message: 'Job deleted' })
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
    }
  }

  const handleClose = async (id, title) => {
    if (!confirm(`Close "${title}"? Applicants will be notified.`)) return
    try {
      await jobAPI.closeJob(id)
      toast({ type: 'success', message: 'Job closed' })
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to close' })
    }
  }

  return (
    <div className="page-container py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Job Listings</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage and track your posted jobs</p>
        </div>
        <Button onClick={() => navigate('/employer/jobs/new')}>
          <Plus className="h-4 w-4" /> Post a Job
        </Button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => { setStatus(s); setPage(1) }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition-colors',
              status === s
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> job{total !== 1 ? 's' : ''}</>}
      </p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : jobs.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="font-semibold text-foreground mb-2">
            {status === 'all' ? 'No jobs posted yet' : `No ${status} jobs`}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {status === 'all' ? 'Post your first job to start receiving applications.' : `You have no ${status} jobs right now.`}
          </p>
          {status === 'all' && (
            <Button onClick={() => navigate('/employer/jobs/new')}>
              <Plus className="h-4 w-4" /> Post a Job
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => (
            <JobCard key={job._id} job={job} onDelete={handleDelete} onClose={handleClose} />
          ))}
        </div>
      )}

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
    </div>
  )
}