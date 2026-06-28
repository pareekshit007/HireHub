import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Briefcase, Bookmark, Clock, CheckCircle, XCircle,
  TrendingUp, ArrowRight, Bell, User, ChevronRight
} from 'lucide-react'
import { Spinner, Badge } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/context/AuthContext'
import { applicationAPI, savedJobAPI, notificationAPI, jobAPI } from '@/api/services'
import { cn, timeAgo, formatSalary, STATUS_COLORS } from '@/lib/utils'

const STATUS_ICONS = {
  pending:     <Clock className="h-4 w-4 text-yellow-500" />,
  reviewed:    <TrendingUp className="h-4 w-4 text-blue-500" />,
  shortlisted: <CheckCircle className="h-4 w-4 text-purple-500" />,
  rejected:    <XCircle className="h-4 w-4 text-red-500" />,
  hired:       <CheckCircle className="h-4 w-4 text-green-500" />,
}

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={cn(
      'bg-card border border-border rounded-xl p-5 flex items-center gap-4 transition-all',
      to && 'hover:shadow-md hover:-translate-y-0.5 cursor-pointer'
    )}>
      <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', color)}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        <p className="text-sm text-muted-foreground">{label}</p>
      </div>
    </div>
  )
  return to ? <Link to={to}>{content}</Link> : content
}

export default function DashboardPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats]     = useState({ total: 0, pending: 0, shortlisted: 0, rejected: 0, hired: 0 })
  const [recentApps, setRecentApps]     = useState([])
  const [savedJobs, setSavedJobs]       = useState([])
  const [notifications, setNotifications] = useState([])
  const [recommended, setRecommended]   = useState([])

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [appsRes, savedRes, notifRes, recRes] = await Promise.allSettled([
          applicationAPI.getMyApplications({ limit: 5, page: 1 }),
          savedJobAPI.getAll({ limit: 4 }),
          notificationAPI.getAll({ limit: 5, unread: true }),
          jobAPI.getRecommended(),
        ])

        if (appsRes.status === 'fulfilled') {
          const apps = appsRes.value.data.applications || []
          setRecentApps(apps)
          const counts = { total: appsRes.value.data.total || apps.length, pending: 0, shortlisted: 0, rejected: 0, hired: 0 }
          apps.forEach((a) => { if (counts[a.status] !== undefined) counts[a.status]++ })
          setStats(counts)
        }
        if (savedRes.status === 'fulfilled')  setSavedJobs(savedRes.value.data.savedJobs || [])
        if (notifRes.status === 'fulfilled')  setNotifications(notifRes.value.data.notifications || [])
        if (recRes.status === 'fulfilled')    setRecommended(recRes.value.data.jobs || [])
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const profileComplete = (() => {
    const p = user?.seekerProfile
    if (!p) return 20
    let score = 20
    if (user.name)       score += 10
    if (p.headline)      score += 15
    if (p.bio)           score += 10
    if (p.skills?.length) score += 15
    if (p.resumeUrl)     score += 20
    if (p.experience?.length) score += 10
    return Math.min(score, 100)
  })()

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )

  return (
    <div className="page-container py-8 space-y-8">

      {/* Welcome header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Here's what's happening with your job search.
          </p>
        </div>
        <Button onClick={() => window.location.href = '/jobs'} className="hidden sm:flex">
          Browse Jobs <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Briefcase}    label="Total Applied"  value={stats.total}       color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"    to="/dashboard/applications" />
        <StatCard icon={Clock}        label="Pending"        value={stats.pending}      color="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400" />
        <StatCard icon={TrendingUp}   label="Shortlisted"   value={stats.shortlisted}  color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400" />
        <StatCard icon={CheckCircle}  label="Hired"          value={stats.hired}        color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400" />
      </div>

      {/* Profile completion */}
      {profileComplete < 100 && (
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              <span className="font-medium text-foreground text-sm">Profile Completion</span>
            </div>
            <span className="text-sm font-bold text-primary">{profileComplete}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-700"
              style={{ width: `${profileComplete}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Complete your profile to get better job matches.{' '}
            <Link to="/profile" className="text-primary hover:underline">Update now →</Link>
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Recent Applications */}
        <div className="lg:col-span-2 bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between p-5 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Applications</h2>
            <Link to="/dashboard/applications" className="text-xs text-primary hover:underline flex items-center gap-1">
              View all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>

          {recentApps.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-3xl mb-2">📋</p>
              <p className="text-sm text-muted-foreground">No applications yet.</p>
              <Link to="/jobs" className="text-primary text-sm hover:underline mt-1 block">Browse jobs →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentApps.map((app) => (
                <div key={app._id} className="p-4 flex items-center gap-4 hover:bg-muted/30 transition-colors">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 font-bold text-primary">
                    {app.job?.title?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-foreground truncate">
                      {app.job?.title || 'Job removed'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {app.job?.employer?.employerProfile?.companyName || 'Company'} · {timeAgo(app.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {STATUS_ICONS[app.status]}
                    <span className={cn('badge capitalize', STATUS_COLORS[app.status])}>{app.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">

          {/* Notifications */}
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Notifications</h3>
              </div>
              <Link to="/notifications" className="text-xs text-primary hover:underline">See all</Link>
            </div>
            {notifications.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">No new notifications</p>
            ) : (
              <div className="divide-y divide-border">
                {notifications.slice(0, 4).map((n) => (
                  <Link key={n._id} to={n.link || '/notifications'} className="block p-3 hover:bg-muted/30 transition-colors">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{n.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(n.createdAt)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Saved jobs */}
          <div className="bg-card border border-border rounded-xl">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-foreground text-sm">Saved Jobs</h3>
              </div>
              <Link to="/dashboard/saved" className="text-xs text-primary hover:underline">See all</Link>
            </div>
            {savedJobs.length === 0 ? (
              <p className="p-4 text-xs text-muted-foreground text-center">No saved jobs yet</p>
            ) : (
              <div className="divide-y divide-border">
                {savedJobs.map((s) => (
                  <Link key={s._id} to={`/jobs/${s.job?._id}`} className="block p-3 hover:bg-muted/30 transition-colors">
                    <p className="text-xs font-medium text-foreground line-clamp-1">{s.job?.title}</p>
                    <p className="text-xs text-muted-foreground">{s.job?.employer?.employerProfile?.companyName}</p>
                    <p className="text-xs text-primary mt-0.5">{formatSalary(s.job?.salary)}</p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recommended jobs */}
      {recommended.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Recommended for You</h2>
            <Link to="/jobs" className="text-xs text-primary hover:underline flex items-center gap-1">
              Browse all <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recommended.slice(0, 3).map((job) => (
              <Link
                key={job._id}
                to={`/jobs/${job._id}`}
                className="bg-card border border-border rounded-xl p-4 card-hover block"
              >
                <p className="font-medium text-sm text-foreground line-clamp-1">{job.title}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {job.employer?.employerProfile?.companyName}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <span className="text-xs font-medium text-primary">{formatSalary(job.salary)}</span>
                  <span className="badge badge-blue text-xs">{job.workMode}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}