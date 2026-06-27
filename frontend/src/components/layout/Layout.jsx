import { Outlet } from 'react-router-dom'
import { Link } from 'react-router-dom'
import { Briefcase, Github, Linkedin, Twitter } from 'lucide-react'
import Navbar from './Navbar'

function Footer() {
  return (
    <footer className="border-t border-border bg-card mt-auto">
      <div className="page-container py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 font-bold text-lg text-primary mb-3">
              <Briefcase className="h-5 w-5" /> HireHub
            </Link>
            <p className="text-sm text-muted-foreground">
              Connecting talent with opportunity. Find your next role or hire your next star.
            </p>
          </div>
          {[
            { title: 'For Job Seekers', links: [['Browse Jobs', '/jobs'], ['Saved Jobs', '/dashboard/saved'], ['My Applications', '/dashboard/applications']] },
            { title: 'For Employers',   links: [['Post a Job', '/employer/jobs/new'], ['My Jobs', '/employer/jobs'], ['Applications', '/employer/applications']] },
            { title: 'Company',         links: [['About', '/about'], ['Contact', '/contact'], ['Privacy', '/privacy']] },
          ].map((col) => (
            <div key={col.title}>
              <h4 className="font-semibold text-sm mb-3">{col.title}</h4>
              <ul className="space-y-2">
                {col.links.map(([label, href]) => (
                  <li key={href}>
                    <Link to={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-border mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} HireHub. All rights reserved.</p>
          <div className="flex gap-4">
            {[Github, Twitter, Linkedin].map((Icon, i) => (
              <a key={i} href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                <Icon className="h-4 w-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

export function DashboardLayout({ children, sidebar }) {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 page-container py-8">
        <div className="flex gap-8">
          {sidebar && <aside className="w-56 shrink-0 hidden lg:block">{sidebar}</aside>}
          <main className="flex-1 min-w-0">{children}</main>
        </div>
      </div>
      <Footer />
    </div>
  )
}