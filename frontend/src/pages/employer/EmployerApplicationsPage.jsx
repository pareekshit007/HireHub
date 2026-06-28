import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Users, Search, Filter, ChevronLeft, ChevronRight,
  Clock, CheckCircle, XCircle, TrendingUp, Eye,
  MapPin, Briefcase, ExternalLink
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { applicationAPI, jobAPI } from '@/api/services'
import { cn, timeAgo, STATUS_COLORS, getInitials } from '@/lib/utils'

const STATUSES = ['all', 'pending', 'reviewed', 'shortlisted', 'rejected', 'hired']

const STATUS_ICONS = {
  pending:     <Clock className="h-4 w-4 text-yellow-500" />,
  reviewed:    <Eye className="h-4 w-4 text-blue-500" />,
  shortlisted: <TrendingUp className="h-4 w-4 text-purple-500" />,
  rejected:    <XCircle className="h-4 w-4 text-red-500" />,
  hired:       <CheckCircle className="h-4 w-4 text-green-500" />,
}

const NEXT_STATUSES = {
  pending:     ['reviewed', 'shortlisted', 'rejected'],
  reviewed:    ['shortlisted', 'rejected'],
  shortlisted: ['hired', 'rejected'],
  hired:       [],
  rejected:    [],
}

function StatusModal({ app, onClose, onUpdate }) {
  const { toast } = useToast()
  const [status, setStatus] = useState('')
  const [note, setNote]     = useState('')
  const [saving, setSaving] = useState(false)

  const next = NEXT_STATUSES[app.status] || []

  const handleSubmit = async () => {
    if (!status) return
    setSaving(true)
    try {
      await applicationAPI.updateStatus(app._id, { status, note })
      toast({ type: 'success', message: `Application marked as ${status}` })
      onUpdate()
      onClose()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed to update' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal open onClose={onClose} title="Update Application Status" description={`Applicant: ${app.applicant?.name}`}>
      <div className="space-y-4">
        <div>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Current Status</p>
          <span className={cn('badge capitalize', STATUS_COLORS[app.status])}>{app.status}</span>
        </div>

        {next.length > 0 ? (
          <>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Move to</p>
              <div className="flex flex-wrap gap-2">
                {next.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-sm font-medium capitalize border transition-colors',
                      status === s
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label className="text-sm font-medium text-foreground">Note (optional)</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note for the applicant…"
                rows={3}
                className={cn(
                  'flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm mt-1.5 resize-none',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'
                )}
              />
            </div>

            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={onClose}>Cancel</Button>
              <Button onClick={handleSubmit} disabled={!status || saving}>
                {saving ? 'Saving…' : 'Update Status'}
              </Button>
            </div>
          </>
        ) : (
          <div className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">
            This application is in a final state and cannot be updated further.
          </div>
        )}
      </div>
    </Modal>
  )
}

function ApplicantCard({ app, onStatusClick }) {
  const [expanded, setExpanded] = useState(false)
  const p = app.applicant

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div
        className="p-5 cursor-pointer hover:bg-muted/20 transition-colors"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="flex items-start gap-4">
          {/* Avatar */}
          <div className="h-11 w-11 rounded-full bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center shrink-0 overflow-hidden">
            {p?.avatar
              ? <img src={p.avatar} alt={p.name} className="h-11 w-11 object-cover" />
              : getInitials(p?.name)
            }
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-foreground">{p?.name}</p>
                <p className="text-sm text-muted-foreground">{p?.email}</p>
                {p?.seekerProfile?.headline && (
                  <p className="text-xs text-muted-foreground mt-0.5">{p.seekerProfile.headline}</p>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {STATUS_ICONS[app.status]}
                <span className={cn('badge capitalize', STATUS_COLORS[app.status])}>{app.status}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-xs text-muted-foreground">
              <span>Applied {timeAgo(app.createdAt)}</span>
              {app.job?.title && (
                <span className="flex items-center gap-1">
                  <Briefcase className="h-3 w-3" />
                  <Link
                    to={`/jobs/${app.job._id}`}
                    onClick={(e) => e.stopPropagation()}
                    className="hover:text-primary transition-colors"
                  >
                    {app.job.title}
                  </Link>
                </span>
              )}
              {p?.seekerProfile?.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {p.seekerProfile.location}
                </span>
              )}
            </div>

            {/* Skills preview */}
            {p?.seekerProfile?.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {p.seekerProfile.skills.slice(0, 5).map((s) => (
                  <span key={s} className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">{s}</span>
                ))}
                {p.seekerProfile.skills.length > 5 && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground text-xs">
                    +{p.seekerProfile.skills.length - 5}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5 pt-4 space-y-4">
          {app.coverLetter && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Cover Letter</p>
              <p className="text-sm text-muted-foreground bg-muted rounded-lg p-3 whitespace-pre-line">{app.coverLetter}</p>
            </div>
          )}

          {/* Status history */}
          {app.statusHistory?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Timeline</p>
              <div className="space-y-1.5">
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
          <div className="flex flex-wrap gap-2">
            {app.resumeUrl && (
              <a href={app.resumeUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm">
                  <ExternalLink className="h-3.5 w-3.5" /> View Resume
                </Button>
              </a>
            )}
            {NEXT_STATUSES[app.status]?.length > 0 && (
              <Button
                size="sm"
                onClick={(e) => { e.stopPropagation(); onStatusClick(app) }}
              >
                Update Status
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function EmployerApplicationsPage() {
  const { toast } = useToast()
  const [searchParams] = useSearchParams()
  const jobIdFilter = searchParams.get('jobId') || ''

  const [apps, setApps]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [status, setStatus]     = useState('all')
  const [page, setPage]         = useState(1)
  const [jobFilter, setJobFilter] = useState(jobIdFilter)
  const [modalApp, setModalApp] = useState(null)
  const limit = 10
  const totalPages = Math.ceil(total / limit)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (status !== 'all') params.status = status
      if (jobFilter)        params.jobId  = jobFilter
      const { data } = await applicationAPI.getAllEmployerApps(params)
      setApps(data.applications || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setApps([])
    } finally {
      setLoading(false)
    }
  }, [page, status, jobFilter])

  useEffect(() => { load() }, [load])

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Applications Received</h1>
        <p className="text-muted-foreground text-sm mt-1">Review and manage candidates for your jobs</p>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-3 mb-6">
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
        {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> application{total !== 1 ? 's' : ''}</>}
      </p>

      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : apps.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <p className="text-5xl mb-4">📬</p>
          <h3 className="font-semibold text-foreground mb-2">No applications yet</h3>
          <p className="text-sm text-muted-foreground">
            {status === 'all'
              ? 'Once candidates apply to your jobs, they will appear here.'
              : `No ${status} applications.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {apps.map((app) => (
            <ApplicantCard key={app._id} app={app} onStatusClick={setModalApp} />
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

      {modalApp && (
        <StatusModal
          app={modalApp}
          onClose={() => setModalApp(null)}
          onUpdate={load}
        />
      )}
    </div>
  )
}