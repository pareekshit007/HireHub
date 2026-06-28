import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase, Clock, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, TrendingUp, Eye, Trash2, MapPin
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { applicationAPI } from '@/api/services'
import { cn, timeAgo, formatSalary, STATUS_COLORS } from '@/lib/utils'

const STATUSES = ['all', 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired']

const STATUS_ICONS = {
  pending:     <Clock className="h-4 w-4 text-yellow-500" />,
  reviewed:    <Eye className="h-4 w-4 text-blue-500" />,
  shortlisted: <TrendingUp className="h-4 w-4 text-purple-500" />,
  rejected:    <XCircle className="h-4 w-4 text-red-500" />,
  hired:       <CheckCircle className="h-4 w-4 text-green-500" />,
}

const STATUS_MESSAGES = {
  pending:     'Your application is under review.',
  reviewed:    'The employer has reviewed your application.',
  shortlisted: '🎉 You\'ve been shortlisted! Expect to hear from them soon.',
  rejected:    'Unfortunately, this application was not successful.',
  hired:       '🎊 Congratulations! You got the job!',
}

function ApplicationCard({ app, onWithdraw }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 font-bold text-primary text-lg">
            {app.job?.employer?.employerProfile?.logoUrl
              ? <img src={app.job.employer.employerProfile.logoUrl} className="h-12 w-12 rounded-lg object-cover" alt="" />
              : app.job?.title?.[0] || '?'
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <Link
                  to={`/jobs/${app.job?._id}`}
                  onClick={(e) => e.stopPropagation()}
                  className="font-semibold text-foreground hover:text-primary transition-colors line-clamp-1"
                >
                  {app.job?.title || 'Job removed'}
                </Link>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {app.job?.employer?.employerProfile?.companyName || 'Company'}
                </p>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {STATUS_ICONS[app.status]}
                <span className={cn('badge capitalize', STATUS_COLORS[app.status])}>
                  {app.status}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              {app.job?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {app.job.location}
                </span>
              )}
              {app.job?.salary && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" /> {formatSalary(app.job.salary)}
                </span>
              )}
              <span>Applied {timeAgo(app.createdAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {/* Status message */}
          <div className={cn(
            'rounded-lg p-3 text-sm',
            app.status === 'hired'       && 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
            app.status === 'shortlisted' && 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
            app.status === 'rejected'    && 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
            app.status === 'reviewed'    && 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
            app.status === 'pending'     && 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
          )}>
            {STATUS_MESSAGES[app.status]}
          </div>

          {/* Employer note */}
          {app.employerNote && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Employer Note</p>
              <p className="text-sm text-foreground bg-muted rounded-lg p-3">{app.employerNote}</p>
            </div>
          )}

          {/* Cover letter */}
          {app.coverLetter && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Your Cover Letter</p>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 line-clamp-4">{app.coverLetter}</p>
            </div>
          )}

          {/* Status timeline */}
          {app.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Timeline</p>
              <div className="space-y-2">
                {app.statusHistory.map((h, i) => (
                  <div key={i} className="flex items-center gap-3 text-xs">
                    <div className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                    <span className="capitalize font-medium text-foreground">{h.status}</span>
                    <span className="text-muted-foreground">{timeAgo(h.changedAt)}</span>
                    {h.note && <span className="text-muted-foreground">· {h.note}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => window.open(`/jobs/${app.job?._id}`, '_blank')}
            >
              <Eye className="h-3.5 w-3.5" /> View Job
            </Button>
            {app.status === 'pending' && !app.isWithdrawn && (
              <Button
                variant="outline" size="sm"
                className="text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => onWithdraw(app._id)}
              >
                <Trash2 className="h-3.5 w-3.5" /> Withdraw
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function ApplicationsPage() {
  const { toast }  = useToast()
  const [apps, setApps]       = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('all')
  const [page, setPage]       = useState(1)
  const limit = 8
  const totalPages = Math.ceil(total / limit)

  const fetch = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status
      const { data } = await applicationAPI.getMyApplications(params)
      setApps(data.applications || [])
      setTotal(data.total || 0)
    } catch {
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [page, status])

  useEffect(() => { fetch() }, [fetch])

  const handleWithdraw = async (id) => {
    if (!confirm('Withdraw this application?')) return
    try {
      await applicationAPI.withdraw(id)
      toast({ type: 'success', message: 'Application withdrawn' })
      fetch()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to withdraw' })
    }
  }

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">My Applications</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track the status of all your job applications
        </p>
      </div>

      {/* Status filter tabs */}
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

      {/* Results count */}
      <p className="text-sm text-muted-foreground mb-4">
        {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> application{total !== 1 ? 's' : ''}</>}
      </p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <p className="text-5xl mb-4">📋</p>
          <h3 className="font-semibold text-foreground mb-2">
            {status === 'all' ? 'No applications yet' : `No ${status} applications`}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {status === 'all' ? 'Start applying to jobs to see them here.' : `You have no ${status} applications right now.`}
          </p>
          <Button onClick={() => window.location.href = '/jobs'}>Browse Jobs</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <ApplicationCard key={app._id} app={app} onWithdraw={handleWithdraw} />
          ))}
        </div>
      )}

      {/* Pagination */}
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