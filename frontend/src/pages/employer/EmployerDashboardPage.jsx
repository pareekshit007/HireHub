import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Briefcase, Users, Eye, Plus, Clock,
  CheckCircle, TrendingUp, ArrowRight,
  BarChart2, AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Card'
import { useAuth } from '@/context/AuthContext'
import { jobAPI, applicationAPI } from '@/api/services'
import { cn, timeAgo, STATUS_COLORS } from '@/lib/utils'

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

const STATUS_ICONS = {
  pending:     <Clock className="h-4 w-4 text-yellow-500" />,
  reviewed:    <Eye className="h-4 w-4 text-blue-500" />,
  shortlisted: <TrendingUp className="h-4 w-4 text-purple-500" />,
  rejected:    <AlertCircle className="h-4 w-4 text-red-500" />,
  hired:       <CheckCircle className="h-4 w-4 text-green-500" />,
}

export default function EmployerDashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [loading, setLoading]   = useState(true)
  const [jobs, setJobs]         = useState([])
  const [recentApps, setRecentApps] = useState([])
  const [stats, setStats]       = useState({
    totalJobs: 0, activeJobs: 0, pendingJobs: 0,
    totalApps: 0, newApps: 0,
  })

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const [jobsRes, appsRes] = await Promise.allSettled([
          jobAPI.getMyJobs({ limit: 5 }),
          applicationAPI.getAllEmployerApps({ limit: 5, page: 1 }),
        ])

        if (jobsRes.status === 'fulfilled') {
          const allJobs = jobsRes.value.data.jobs || []
          setJobs(allJobs)
          setStats((s) => ({
            ...s,
            totalJobs:  jobsRes.value.data.pagination?.total || allJobs.length,
            activeJobs: allJobs.filter((j) => j.status === 'active').length,
            pendingJobs: allJobs.filter((j) => j.status === 'pending').length,
          }))
        }

        if (appsRes.status === 'fulfilled') {
          const apps = appsRes.value.data.applications || []
          setRecentApps(apps)
          setStats((s) => ({
            ...s,
            totalApps: appsRes.value.data.pagination?.total || apps.length,
            newApps:   apps.filter((a) => a.status === 'pending').length,
          }))
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex justify-center items-center min-h-[50vh]">
      <Spinner size="lg" />
    </div>
  )

  const company = user?.employerProfile?.companyName || user?.name

  return (
    <div className="page-container py-8 space-y-8">

      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back{company ? `, ${company}` : ''}! 👋
          </h1>
          <p className="text-muted-foreground mt-1">Here's an overview of your hiring activity.</p>
        </div>
        <Button onClick={() => navigate('/employer/jobs/new')}>
          <Plus className="h-4 w-4" /> Post a Job
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          icon={Briefcase} label="Total Jobs" value={stats.totalJobs}
          color="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
          to="/employer/jobs"
        />
        <StatCard
          icon={CheckCircle} label="Active Jobs" value={stats.activeJobs}
          color="bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400"
          to="/employer/jobs?status=active"
        />
        <StatCard
          icon={Users} label="Total Applications" value={stats.totalApps}
          color="bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400"
          to="/employer/applications"
        />
        <StatCard
          icon={Clock} label="New (Unreviewed)" value={stats.newApps}
          color="bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400"
          to="/employer/applications?status=pending"
        />
      </div>

      {/* Pending approval notice */}
      {stats.pendingJobs > 0 && (
        <div className="rounded-xl border border-yellow-200 dark:border-yellow-800 bg-yellow-50 dark:bg-yellow-900/20 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
          <div>
            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
              {stats.pendingJobs} job{stats.pendingJobs > 1 ? 's' : ''} awaiting admin approval
            </p>
            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-0.5">
              Your listing{stats.pendingJobs > 1 ? 's' : ''} will go live once reviewed.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Recent Jobs */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Jobs</h2>
            <Link to="/employer/jobs" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {jobs.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm mb-3">No jobs posted yet</p>
              <Button size="sm" onClick={() => navigate('/employer/jobs/new')}>
                <Plus className="h-3.5 w-3.5" /> Post Your First Job
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job) => (
                <div key={job._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <Link
                      to={`/jobs/${job._id}`}
                      className="text-sm font-medium text-foreground hover:text-primary transition-colors line-clamp-1"
                    >
                      {job.title}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {job.applicationCount ?? 0} applicants · {timeAgo(job.createdAt)}
                    </p>
                  </div>
                  <span className={cn('badge capitalize shrink-0', STATUS_COLORS[job.status])}>
                    {job.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Applications */}
        <div className="bg-card border border-border rounded-xl">
          <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border">
            <h2 className="font-semibold text-foreground">Recent Applications</h2>
            <Link to="/employer/applications" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {recentApps.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-muted-foreground text-sm">No applications received yet.</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {recentApps.map((app) => (
                <div key={app._id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/30 transition-colors">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0">
                    {app.applicant?.avatar
                      ? <img src={app.applicant.avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                      : (app.applicant?.name?.[0] || '?')
                    }
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{app.applicant?.name}</p>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {app.job?.title} · {timeAgo(app.createdAt)}
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
      </div>

      {/* Company profile completeness nudge */}
      {!user?.employerProfile?.companyName && (
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-5 flex items-start gap-4">
          <BarChart2 className="h-6 w-6 text-primary mt-0.5 shrink-0" />
          <div className="flex-1">
            <p className="font-semibold text-foreground">Complete your company profile</p>
            <p className="text-sm text-muted-foreground mt-1">
              A complete profile builds trust with candidates and increases your application rate.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/profile')}>
            Set Up Profile
          </Button>
        </div>
      )}
    </div>
  )
}