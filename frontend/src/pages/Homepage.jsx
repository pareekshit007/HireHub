import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Search, MapPin, Briefcase, TrendingUp, Users, Building2,
  ArrowRight, CheckCircle, Zap, Globe, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

const CATEGORIES = [
  { label: 'Technology',       icon: '💻', color: 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',   value: 'Technology'      },
  { label: 'Design',           icon: '🎨', color: 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300', value: 'Design'     },
  { label: 'Finance',          icon: '💰', color: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',  value: 'Finance'        },
  { label: 'Healthcare',       icon: '🏥', color: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',         value: 'Healthcare'     },
  { label: 'Marketing',        icon: '📣', color: 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300', value: 'Marketing'  },
  { label: 'Education',        icon: '📚', color: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300', value: 'Education' },
  { label: 'Data Science',     icon: '📊', color: 'bg-cyan-50 dark:bg-cyan-900/20 text-cyan-700 dark:text-cyan-300',     value: 'Data Science'   },
  { label: 'Product',          icon: '🚀', color: 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300', value: 'Product'   },
]

const STATS = [
  { icon: Briefcase, label: 'Active Jobs',      value: '10,000+' },
  { icon: Building2, label: 'Companies',        value: '2,500+'  },
  { icon: Users,     label: 'Job Seekers',      value: '50,000+' },
  { icon: TrendingUp,label: 'Placements/Month', value: '1,200+'  },
]

const WHY_US = [
  { icon: Zap,          title: 'Fast Applications',   desc: 'Apply to multiple jobs in minutes with your saved profile and resume.' },
  { icon: Globe,        title: 'Remote Friendly',     desc: 'Browse thousands of remote, hybrid and on-site opportunities nationwide.' },
  { icon: CheckCircle,  title: 'Verified Employers',  desc: 'Every company is reviewed so you only deal with legitimate opportunities.' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const [search, setSearch]     = useState('')
  const [location, setLocation] = useState('')

  const handleSearch = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (search.trim())   params.set('q', search.trim())
    if (location.trim()) params.set('location', location.trim())
    navigate(`/jobs?${params.toString()}`)
  }

  const handleCategory = (value) => {
    navigate(`/jobs?category=${encodeURIComponent(value)}`)
  }

  return (
    <div className="flex flex-col">

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-background py-20 md:py-28">
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-primary/5 blur-3xl" />

        <div className="page-container relative">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary mb-6">
              <TrendingUp className="h-3 w-3" /> 1,200+ placements this month
            </span>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-foreground leading-tight tracking-tight mb-6">
              Find Your{' '}
              <span className="text-primary relative">
                Dream Job
                <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 300 8" fill="none">
                  <path d="M0 6 Q75 0 150 4 Q225 8 300 2" stroke="hsl(var(--primary))" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.4"/>
                </svg>
              </span>{' '}
              Today
            </h1>

            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Connect with top companies hiring right now. Thousands of verified jobs across every industry.
            </p>

            {/* Search bar */}
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 bg-card border border-border rounded-xl p-2 shadow-lg max-w-2xl mx-auto">
              <div className="flex items-center gap-2 flex-1 px-3">
                <Search className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Job title, keyword or company"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <div className="hidden sm:block w-px bg-border self-stretch" />
              <div className="flex items-center gap-2 flex-1 px-3">
                <MapPin className="h-4 w-4 text-muted-foreground shrink-0" />
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="City or remote"
                  className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>
              <Button type="submit" size="lg" className="shrink-0 rounded-lg">
                Search Jobs
              </Button>
            </form>

            <p className="text-xs text-muted-foreground mt-4">
              Popular: <span className="space-x-2">
                {['React Developer', 'UI/UX Designer', 'Product Manager', 'Data Analyst'].map((t) => (
                  <button
                    key={t}
                    onClick={() => { setSearch(t); navigate(`/jobs?q=${encodeURIComponent(t)}`) }}
                    className="hover:text-primary hover:underline transition-colors"
                  >
                    {t}
                  </button>
                ))}
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────────────────────── */}
      <section className="border-y border-border bg-muted/30">
        <div className="page-container py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map(({ icon: Icon, label, value }) => (
              <div key={label} className="text-center">
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-2xl font-bold text-foreground">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────────────────────────── */}
      <section className="page-container py-16">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Browse by Category</h2>
            <p className="text-muted-foreground text-sm mt-1">Find jobs in your field of expertise</p>
          </div>
          <Link to="/jobs" className="hidden sm:flex items-center gap-1 text-sm text-primary hover:underline font-medium">
            View all <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {CATEGORIES.map(({ label, icon, color, value }) => (
            <button
              key={value}
              onClick={() => handleCategory(value)}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border border-transparent',
                'hover:border-primary/30 hover:shadow-sm transition-all text-left group',
                color
              )}
            >
              <span className="text-2xl">{icon}</span>
              <div>
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs opacity-70 group-hover:opacity-100 transition-opacity">Browse jobs</p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Why HireHub ────────────────────────────────────────────────────── */}
      <section className="bg-muted/30 border-y border-border">
        <div className="page-container py-16">
          <div className="text-center mb-12">
            <h2 className="text-2xl font-bold text-foreground">Why Choose HireHub?</h2>
            <p className="text-muted-foreground text-sm mt-1">Built for modern job seekers and employers</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {WHY_US.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-card rounded-xl border border-border p-6 text-center hover:shadow-md transition-shadow">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────────── */}
      <section className="page-container py-16">
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary/80 p-10 text-center text-primary-foreground">
          <h2 className="text-3xl font-bold mb-3">Ready to find your next role?</h2>
          <p className="text-primary-foreground/80 mb-8 max-w-md mx-auto">
            Join over 50,000 professionals who found their perfect job on HireHub.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => navigate('/register')}
              className="font-semibold"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/jobs')}
              className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 font-semibold"
            >
              Browse all jobs
            </Button>
          </div>
        </div>
      </section>

    </div>
  )
}