import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import {
  Search, MapPin, SlidersHorizontal, X, Briefcase,
  ChevronLeft, ChevronRight, Building2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Badge, Spinner } from '@/components/ui/Card'
import { cn, formatSalary, timeAgo, JOB_TYPE_COLORS } from '@/lib/utils'
import { jobAPI } from '@/api/services'

const JOB_TYPES    = ['Full-time', 'Part-time', 'Contract', 'Internship', 'Freelance']
const WORK_MODES   = ['On-site', 'Remote', 'Hybrid']
const EXP_LEVELS   = ['Entry', 'Mid', 'Senior', 'Lead', 'Executive']
const CATEGORIES   = ['Technology','Finance','Healthcare','Education','Marketing','Design','Sales','Operations','HR','Legal','Engineering','Customer Support','Data Science','Product','Other']

function JobCard({ job }) {
  const navigate = useNavigate()
  return (
    <div
      onClick={() => navigate(`/jobs/${job._id}`)}
      className="bg-card border border-border rounded-xl p-5 cursor-pointer card-hover group"
    >
      <div className="flex items-start gap-4">
        {/* Company logo / initials */}
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 text-primary font-bold text-lg border border-primary/20">
          {job.employer?.employerProfile?.logoUrl
            ? <img src={job.employer.employerProfile.logoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />
            : (job.employer?.employerProfile?.companyName?.[0] || <Building2 className="h-5 w-5" />)
          }
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                {job.title}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {job.employer?.employerProfile?.companyName || 'Company'}
              </p>
            </div>
            <span className={cn('badge shrink-0', JOB_TYPE_COLORS[job.jobType] || 'badge-gray')}>
              {job.jobType}
            </span>
          </div>

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
            {job.experienceLevel && <span>{job.experienceLevel} level</span>}
          </div>

          <div className="flex items-center justify-between mt-3">
            <p className="text-sm font-medium text-foreground">{formatSalary(job.salary)}</p>
            <p className="text-xs text-muted-foreground">{timeAgo(job.createdAt)}</p>
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
    </div>
  )
}

function FilterSidebar({ filters, setFilters, onClose }) {
  const set = (key, val) => setFilters((f) => ({ ...f, [key]: val === f[key] ? '' : val, page: 1 }))

  return (
    <div className="space-y-6">
      {onClose && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Filters</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      {[
        { title: 'Job Type',    key: 'jobType',    options: JOB_TYPES  },
        { title: 'Work Mode',   key: 'workMode',   options: WORK_MODES },
        { title: 'Experience',  key: 'experienceLevel', options: EXP_LEVELS },
      ].map(({ title, key, options }) => (
        <div key={key}>
          <p className="text-sm font-semibold text-foreground mb-2">{title}</p>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <button
                key={o}
                onClick={() => set(key, o)}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                  filters[key] === o
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
                )}
              >
                {o}
              </button>
            ))}
          </div>
        </div>
      ))}

      <div>
        <p className="text-sm font-semibold text-foreground mb-2">Category</p>
        <select
          value={filters.category}
          onChange={(e) => setFilters((f) => ({ ...f, category: e.target.value, page: 1 }))}
          className="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:border-primary"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {Object.values(filters).some((v) => v && v !== 1) && (
        <button
          onClick={() => setFilters({ q: '', location: '', jobType: '', workMode: '', experienceLevel: '', category: '', page: 1 })}
          className="text-xs text-destructive hover:underline"
        >
          Clear all filters
        </button>
      )}
    </div>
  )
}

export default function JobsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [jobs, setJobs]         = useState([])
  const [total, setTotal]       = useState(0)
  const [loading, setLoading]   = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  const [filters, setFilters] = useState({
    q:               searchParams.get('q')        || '',
    location:        searchParams.get('location') || '',
    jobType:         searchParams.get('jobType')  || '',
    workMode:        searchParams.get('workMode') || '',
    experienceLevel: searchParams.get('experienceLevel') || '',
    category:        searchParams.get('category') || '',
    page:            parseInt(searchParams.get('page') || '1'),
  })

  const [searchInput, setSearchInput]     = useState(filters.q)
  const [locationInput, setLocationInput] = useState(filters.location)

  const limit = 10
  const totalPages = Math.ceil(total / limit)

  const fetchJobs = useCallback(async () => {
    setLoading(true)
    try {
      const params = { limit, ...filters }
      Object.keys(params).forEach((k) => { if (!params[k]) delete params[k] })
      const { data } = await jobAPI.getJobs(params)
      setJobs(data.jobs || [])
      setTotal(data.total || 0)
    } catch {
      setJobs([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  useEffect(() => { fetchJobs() }, [fetchJobs])

  useEffect(() => {
    const params = {}
    Object.entries(filters).forEach(([k, v]) => { if (v && v !== 1) params[k] = v })
    setSearchParams(params, { replace: true })
  }, [filters])

  const handleSearch = (e) => {
    e.preventDefault()
    setFilters((f) => ({ ...f, q: searchInput.trim(), location: locationInput.trim(), page: 1 }))
  }

  const activeFilterCount = [filters.jobType, filters.workMode, filters.experienceLevel, filters.category].filter(Boolean).length

  return (
    <div className="page-container py-8">

      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-card border border-border rounded-xl p-2 shadow-sm mb-6">
        <div className="flex items-center gap-2 flex-1 px-3">
          <Search className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Job title, keyword or company"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <div className="hidden sm:block w-px bg-border self-stretch" />
        <div className="flex items-center gap-2 flex-1 px-3">
          <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
          <input
            value={locationInput}
            onChange={(e) => setLocationInput(e.target.value)}
            placeholder="City or remote"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
          />
        </div>
        <Button type="submit" className="shrink-0 rounded-lg">Search</Button>
      </form>

      <div className="flex gap-6">

        {/* Sidebar — desktop */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="bg-card border border-border rounded-xl p-5 sticky top-24">
            <FilterSidebar filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">

          {/* Results header */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> jobs found</>}
            </p>
            <button
              onClick={() => setShowFilters(true)}
              className="lg:hidden flex items-center gap-2 text-sm border border-border rounded-lg px-3 py-1.5 hover:bg-muted transition-colors"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters {activeFilterCount > 0 && <span className="badge badge-blue">{activeFilterCount}</span>}
            </button>
          </div>

          {/* Active filter chips */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {[
                { key: 'jobType', label: filters.jobType },
                { key: 'workMode', label: filters.workMode },
                { key: 'experienceLevel', label: filters.experienceLevel },
                { key: 'category', label: filters.category },
              ].filter((f) => f.label).map(({ key, label }) => (
                <span key={key} className="flex items-center gap-1 badge badge-blue">
                  {label}
                  <button onClick={() => setFilters((f) => ({ ...f, [key]: '', page: 1 }))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Jobs list */}
          {loading ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-5xl mb-4">🔍</p>
              <h3 className="font-semibold text-foreground mb-2">No jobs found</h3>
              <p className="text-sm text-muted-foreground mb-4">Try adjusting your search or filters</p>
              <Button variant="outline" onClick={() => {
                setFilters({ q: '', location: '', jobType: '', workMode: '', experienceLevel: '', category: '', page: 1 })
                setSearchInput(''); setLocationInput('')
              }}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => <JobCard key={job._id} job={job} />)}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <Button
                variant="outline" size="sm"
                disabled={filters.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: f.page - 1 }))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const page = filters.page <= 3 ? i + 1 : filters.page - 2 + i
                if (page > totalPages) return null
                return (
                  <button
                    key={page}
                    onClick={() => setFilters((f) => ({ ...f, page }))}
                    className={cn(
                      'h-9 w-9 rounded-md text-sm font-medium transition-colors',
                      filters.page === page
                        ? 'bg-primary text-primary-foreground'
                        : 'border border-border hover:bg-muted text-foreground'
                    )}
                  >
                    {page}
                  </button>
                )
              })}
              <Button
                variant="outline" size="sm"
                disabled={filters.page >= totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: f.page + 1 }))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-card rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <FilterSidebar filters={filters} setFilters={setFilters} onClose={() => setShowFilters(false)} />
          </div>
        </div>
      )}
    </div>
  )
}