import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, Briefcase, FileText, TrendingUp,
  Clock, CheckCircle, XCircle, ArrowRight,
  AlertCircle
} from 'lucide-react'
import { Spinner } from '@/components/ui/Card'
import { adminAPI } from '@/api/services'
import { cn, timeAgo, STATUS_COLORS } from '@/lib/utils'

function StatCard({ icon: Icon, label, value, sub, color, to }) {
  const content = (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 transition-all',
      to && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
    )}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-3xl font-bold text-foreground mt-1">{value ?? '—'}</p>
          {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
        </div>
        <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center shrink-0', color)}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

const ROLE_COLORS = { seeker: 'badge-blue', employer: 'badge-purple', admin: 'badge-gray' }

export default function AdminDashboardPage() {
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]   = useState(false)

  useEffect(() => {
    adminAPI.getStats()
      .then(({ data }) => setData(data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]"><Spinner size="lg" /></div>
  )
  if (error) return (
    <div className="page-container py-16 text-center">
      <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-3" />
      <p className="font-semibold text-foreground">Failed to load stats</p>
    </div>
  )

  const { stats, recentUsers = [], recentJobs = [], charts = {} } = data

  // simple bar chart using div widths
  const maxAppDay = Math.max(...(charts.appsByDay || []).map(d => d.count), 1)
  const maxCatCount = Math.max(...(charts.jobsByCategory || []).map(d => d.count), 1)

  return (
    <div className="page-container py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">Platform-wide overview</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users}     label="Total Users"     value={stats.users.total}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400" to="/admin/users" />
        <StatCard icon={Users}     label="Job Seekers"     value={stats.users.seekers}
          color="bg-sky-50 dark:bg-sky-900/20 text-sky-600 dark:text-sky-400"
          to="/admin/users?role=seeker" />
        <StatCard icon={Briefcase} label="Employers"       value={stats.users.employers}
          color="bg-violet-50 dark:bg-violet-900/20 text-violet-600 dark:text-violet-400"
          to="/admin/users?role=employer" />
        <StatCard icon={Briefcase} label="Active Jobs"     value={stats.jobs.active}
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          to="/admin/jobs?status=active" />
        <StatCard icon={Clock}     label="Pending Approval" value={stats.jobs.pending}
          color="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
          to="/admin/jobs?status=pending" />
        <StatCard icon={FileText}  label="Applications"    value={stats.applications.total}
          color="bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Applications last 7 days */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Applications — Last 7 Days</h2>
          {charts.appsByDay?.length > 0 ? (
            <div className="space-y-2">
              {charts.appsByDay.map((d) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{d._id}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-primary/70 rounded transition-all"
                      style={{ width: `${(d.count / maxAppDay) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No applications in the last 7 days.</p>
          )}
        </div>

        {/* Jobs by category */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-4">Active Jobs by Category</h2>
          {charts.jobsByCategory?.length > 0 ? (
            <div className="space-y-2">
              {charts.jobsByCategory.map((d) => (
                <div key={d._id} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-32 shrink-0 truncate">{d._id}</span>
                  <div className="flex-1 h-6 bg-muted rounded overflow-hidden">
                    <div
                      className="h-full bg-violet-400/70 rounded transition-all"
                      style={{ width: `${(d.count / maxCatCount) * 100}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-foreground w-6 text-right">{d.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No active jobs yet.</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Users */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Users</h2>
            <Link to="/admin/users" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentUsers.map((u) => (
              <div key={u._id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
                  {u.avatar ? <img src={u.avatar} alt="" className="h-8 w-8 object-cover" /> : u.name?.[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{u.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                </div>
                <span className={cn('badge capitalize shrink-0', ROLE_COLORS[u.role])}>{u.role}</span>
                <span className="text-xs text-muted-foreground shrink-0">{timeAgo(u.createdAt)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Jobs */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Jobs</h2>
            <Link to="/admin/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div className="divide-y divide-border">
            {recentJobs.map((j) => (
              <div key={j._id} className="flex items-center gap-3 px-5 py-3.5">
                <div className="flex-1 min-w-0">
                  <Link to={`/jobs/${j._id}`} className="text-sm font-medium text-foreground hover:text-primary transition-colors truncate block">
                    {j.title}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {j.employer?.employerProfile?.companyName || j.employer?.name} · {timeAgo(j.createdAt)}
                  </p>
                </div>
                <span className={cn('badge capitalize shrink-0', STATUS_COLORS[j.status])}>{j.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}