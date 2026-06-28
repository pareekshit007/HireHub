import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Search, CheckCircle, XCircle, Eye, Trash2,
  ChevronLeft, ChevronRight, MapPin, Users,
  AlertCircle, Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { adminAPI, jobAPI } from '@/api/services'
import { cn, timeAgo, formatSalary, STATUS_COLORS } from '@/lib/utils'

const STATUSES = ['all', 'pending', 'active', 'closed', 'rejected']

function RejectModal({ job, onClose, onConfirm }) {
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)
  const handleSubmit = async () => {
    setLoading(true)
    await onConfirm(reason)
    setLoading(false)
  }
  return (
    <Modal open onClose={onClose} title="Reject Job Listing" description={`"${job.title}"`}>
      <div className="space-y-4">
        <div className="form-group">
          <label className="text-sm font-medium text-foreground">Reason (optional)</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Let the employer know why the listing was rejected…"
            rows={3}
            className={cn(
              'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 resize-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
            )}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Rejecting…</> : 'Reject Job'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function JobRow({ job, onApprove, onReject, onDelete, approving }) {
  return (
    <div className="flex items-start gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-start gap-2 flex-wrap">
          <Link
            to={`/jobs/${job._id}`}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
          >
            {job.title}
          </Link>
          <span className={cn('badge capitalize shrink-0', STATUS_COLORS[job.status])}>{job.status}</span>
        </div>

        <p className="text-xs text-muted-foreground mt-0.5">
          {job.employer?.employerProfile?.companyName || job.employer?.name || 'Unknown'} · {job.category}
        </p>

        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-muted-foreground">
          {job.location && (
            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {job.location}</span>
          )}
          <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {job.applicationCount ?? 0} applicants</span>
          <span>{timeAgo(job.createdAt)}</span>
          {!job.salary?.isHidden && <span>{formatSalary(job.salary)}</span>}
        </div>

        <div className="flex flex-wrap gap-1.5 mt-2">
          <span className="badge badge-blue">{job.jobType}</span>
          <span className="badge badge-purple">{job.workMode}</span>
          {job.experienceLevel && <span className="badge badge-yellow">{job.experienceLevel}</span>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Link to={`/jobs/${job._id}`}>
          <Button variant="ghost" size="icon" title="Preview">
            <Eye className="h-4 w-4" />
          </Button>
        </Link>
        {job.status === 'pending' && (
          <>
            <Button
              variant="ghost" size="icon"
              title="Approve"
              className="text-muted-foreground hover:text-green-600"
              disabled={approving === job._id}
              onClick={() => onApprove(job._id)}
            >
              {approving === job._id
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <CheckCircle className="h-4 w-4" />
              }
            </Button>
            <Button
              variant="ghost" size="icon"
              title="Reject"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onReject(job)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </>
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
  )
}

export default function AdminJobsPage() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [jobs, setJobs]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState(searchParams.get('status') || 'all')
  const [page, setPage]       = useState(1)
  const [approving, setApproving] = useState(null)
  const [rejectTarget, setRejectTarget] = useState(null)

  const limit = 15
  const totalPages = Math.ceil(total / limit)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status
      if (search.trim())    params.search  = search.trim()
      const { data } = await adminAPI.getJobs(params)
      setJobs(data.jobs || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [page, status, search])

  useEffect(() => { load() }, [load])

  const handleApprove = async (id) => {
    setApproving(id)
    try {
      await jobAPI.approveJob(id)
      toast({ type: 'success', message: 'Job approved and now live' })
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to approve' })
    } finally {
      setApproving(null)
    }
  }

  const handleRejectConfirm = async (reason) => {
    try {
      await jobAPI.rejectJob(rejectTarget._id, { reason })
      toast({ type: 'success', message: 'Job rejected' })
      setRejectTarget(null)
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to reject' })
    }
  }

  const handleDelete = async (id, title) => {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return
    try {
      await jobAPI.deleteJob(id)
      toast({ type: 'success', message: 'Job deleted' })
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to delete' })
    }
  }

  const pendingCount = jobs.filter((j) => j.status === 'pending').length

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Job Management</h1>
        <p className="text-muted-foreground text-sm mt-1">Approve, reject, or remove job listings</p>
      </div>

      {/* Pending alert */}
      {status === 'pending' && pendingCount > 0 && (
        <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-center gap-3 mb-6">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 shrink-0" />
          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
            {pendingCount} job{pendingCount > 1 ? 's' : ''} waiting for your approval
          </p>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search jobs…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
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
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> job{total !== 1 ? 's' : ''}</>}
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">📋</p>
            <p className="font-semibold text-foreground">No jobs found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {jobs.map((job) => (
              <JobRow
                key={job._id}
                job={job}
                onApprove={handleApprove}
                onReject={setRejectTarget}
                onDelete={handleDelete}
                approving={approving}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {rejectTarget && (
        <RejectModal
          job={rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleRejectConfirm}
        />
      )}
    </div>
  )
}