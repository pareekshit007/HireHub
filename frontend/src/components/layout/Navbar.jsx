import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { notificationAPI } from '@/api/services'
import { getInitials } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import {
  Sun, Moon, Bell, Menu, X, Briefcase, ChevronDown,
  User, LayoutDashboard, LogOut, Settings, Bookmark,
  Building2, Shield
} from 'lucide-react'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

const NAV_LINKS = {
  public:   [{ label: 'Find Jobs', href: '/jobs' }],
  seeker:   [{ label: 'Find Jobs', href: '/jobs' }, { label: 'Dashboard', href: '/dashboard' }, { label: 'Applications', href: '/dashboard/applications' }, { label: 'Saved Jobs', href: '/dashboard/saved' }],
  employer: [{ label: 'Post a Job', href: '/employer/jobs/new' }, { label: 'My Jobs', href: '/employer/jobs' }, { label: 'Applications', href: '/employer/applications' }],
  admin:    [{ label: 'Dashboard', href: '/admin/dashboard' }, { label: 'Users', href: '/admin/users' }, { label: 'Jobs', href: '/admin/jobs' }],
}

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate  = useNavigate()
  const location  = useLocation()

  const [mobileOpen, setMobileOpen]   = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [scrolled, setScrolled]       = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (!isAuthenticated) return
    notificationAPI.getAll({ unread: true, limit: 1 })
      .then(({ data }) => setUnreadCount(data.unreadCount || 0))
      .catch(() => {})
  }, [isAuthenticated, location.pathname])

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const links = isAuthenticated ? (NAV_LINKS[user?.role] || NAV_LINKS.public) : NAV_LINKS.public

  const dashMap = {
    seeker:   '/dashboard',
    employer: '/employer/dashboard',
    admin:    '/admin/dashboard',
  }

  const isActive = (href) =>
    href === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(href)

  return (
    <header className={cn(
      'sticky top-0 z-40 w-full bg-background/95 backdrop-blur transition-all duration-200',
      scrolled ? 'shadow-sm border-b border-border' : 'border-b border-transparent'
    )}>
      <div className="page-container">
        <div className="flex h-16 items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 font-bold text-xl text-primary shrink-0">
            <Briefcase className="h-5 w-5" />
            <span>HireHub</span>
          </Link>

          {/* Desktop nav links */}
          <nav className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  isActive(l.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* Right side */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {isAuthenticated ? (
              <>
                {/* Notifications bell */}
                <Link
                  to="/notifications"
                  className="relative h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-4 w-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </Link>

                {/* User dropdown */}
                <DropdownMenu.Root>
                  <DropdownMenu.Trigger asChild>
                    <button className="flex items-center gap-2 h-9 pl-1.5 pr-2 rounded-md hover:bg-muted transition-colors">
                      <div className="h-7 w-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold flex items-center justify-center shrink-0">
                        {user?.avatar
                          ? <img src={user.avatar} alt={user.name} className="h-7 w-7 rounded-full object-cover" />
                          : getInitials(user?.name)
                        }
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-foreground max-w-[100px] truncate">
                        {user?.name?.split(' ')[0]}
                      </span>
                      <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                    </button>
                  </DropdownMenu.Trigger>

                  <DropdownMenu.Portal>
                    <DropdownMenu.Content
                      align="end"
                      sideOffset={6}
                      className="z-50 w-52 rounded-lg border border-border bg-card shadow-lg p-1 animate-slide-in-bottom"
                    >
                      {/* User info */}
                      <div className="px-3 py-2 mb-1">
                        <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                        <span className="inline-flex items-center gap-1 mt-1 text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary font-medium capitalize">
                          {user?.role === 'admin' && <Shield className="h-3 w-3" />}
                          {user?.role === 'employer' && <Building2 className="h-3 w-3" />}
                          {user?.role}
                        </span>
                      </div>

                      <DropdownMenu.Separator className="h-px bg-border my-1" />

                      <DropdownMenu.Item asChild>
                        <Link to={dashMap[user?.role] || '/dashboard'} className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none">
                          <LayoutDashboard className="h-4 w-4 text-muted-foreground" /> Dashboard
                        </Link>
                      </DropdownMenu.Item>
                      <DropdownMenu.Item asChild>
                        <Link to="/profile" className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none">
                          <User className="h-4 w-4 text-muted-foreground" /> Profile
                        </Link>
                      </DropdownMenu.Item>
                      {user?.role === 'seeker' && (
                        <DropdownMenu.Item asChild>
                          <Link to="/dashboard/saved" className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none">
                            <Bookmark className="h-4 w-4 text-muted-foreground" /> Saved Jobs
                          </Link>
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item asChild>
                        <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm text-foreground rounded-md hover:bg-muted cursor-pointer outline-none">
                          <Settings className="h-4 w-4 text-muted-foreground" /> Settings
                        </Link>
                      </DropdownMenu.Item>

                      <DropdownMenu.Separator className="h-px bg-border my-1" />

                      <DropdownMenu.Item
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-3 py-2 text-sm text-destructive rounded-md hover:bg-destructive/10 cursor-pointer outline-none"
                      >
                        <LogOut className="h-4 w-4" /> Sign out
                      </DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Portal>
                </DropdownMenu.Root>
              </>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>Sign in</Button>
                <Button size="sm" onClick={() => navigate('/register')}>Get started</Button>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden h-9 w-9 flex items-center justify-center rounded-md text-muted-foreground hover:bg-muted transition-colors"
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border py-3 space-y-1 animate-slide-in-bottom">
            {links.map((l) => (
              <Link
                key={l.href}
                to={l.href}
                className={cn(
                  'block px-3 py-2 rounded-md text-sm font-medium transition-colors',
                  isActive(l.href)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )}
              >
                {l.label}
              </Link>
            ))}
            {!isAuthenticated && (
              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => navigate('/login')}>Sign in</Button>
                <Button size="sm" className="flex-1" onClick={() => navigate('/register')}>Get started</Button>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  )
}