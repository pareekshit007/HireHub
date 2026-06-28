import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell, BellOff, Check, CheckCheck, Trash2,
  Briefcase, UserCheck, XCircle, Info, ChevronLeft, ChevronRight
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Card'
import { useToast } from '@/components/ui/Toast'
import { notificationAPI } from '@/api/services'
import { cn, timeAgo } from '@/lib/utils'

const TYPE_CONFIG = {
  application_received: { icon: Briefcase,  color: 'text-blue-500',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  application_status:   { icon: UserCheck,  color: 'text-purple-500', bg: 'bg-purple-50 dark:bg-purple-900/20' },
  job_approved:         { icon: Check,      color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  job_rejected:         { icon: XCircle,    color: 'text-red-500',    bg: 'bg-red-50 dark:bg-red-900/20' },
  job_closed:           { icon: BellOff,    color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
  account_verified:     { icon: UserCheck,  color: 'text-green-500',  bg: 'bg-green-50 dark:bg-green-900/20' },
  general:              { icon: Info,       color: 'text-gray-500',   bg: 'bg-gray-50 dark:bg-gray-900/20' },
}

function NotificationItem({ notif, onMarkRead, onDelete }) {
  const navigate  = useNavigate()
  const config    = TYPE_CONFIG[notif.type] || TYPE_CONFIG.general
  const Icon      = config.icon

  const handleClick = async () => {
    if (!notif.isRead) await onMarkRead(notif._id)
    if (notif.link)   navigate(notif.link)
  }

  return (
    <div className={cn(
      'flex gap-4 p-4 rounded-xl border transition-all group cursor-pointer',
      notif.isRead
        ? 'bg-card border-border hover:bg-muted/30'
        : 'bg-primary/5 border-primary/20 hover:bg-primary/10'
    )}
      onClick={handleClick}
    >
      {/* Icon */}
      <div className={cn('h-10 w-10 rounded-full flex items-center justify-center shrink-0', config.bg)}>
        <Icon className={cn('h-5 w-5', config.color)} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn('text-sm font-medium line-clamp-1', notif.isRead ? 'text-foreground' : 'text-foreground font-semibold')}>
            {notif.title}
          </p>
          {!notif.isRead && (
            <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
          )}
        </div>
        <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">{notif.message}</p>
        <p className="text-xs text-muted-foreground/60 mt-1">{timeAgo(notif.createdAt)}</p>
      </div>

      {/* Actions */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!notif.isRead && (
          <button
            onClick={(e) => { e.stopPropagation(); onMarkRead(notif._id) }}
            title="Mark as read"
            className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(notif._id) }}
          title="Delete"
          className="h-7 w-7 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}

export default function NotificationsPage() {
  const { toast } = useToast()
  const [notifs,   setNotifs]   = useState([])
  const [total,    setTotal]    = useState(0)
  const [unread,   setUnread]   = useState(0)
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all') // all | unread
  const [page,     setPage]     = useState(1)
  const limit      = 10
  const totalPages = Math.ceil(total / limit)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (filter === 'unread') params.unread = true
      const { data } = await notificationAPI.getAll(params)
      setNotifs(data.notifications || [])
      setTotal(data.pagination?.total || 0)
      setUnread(data.unreadCount || 0)
    } catch {
      setNotifs([])
    } finally {
      setLoading(false)
    }
  }, [page, filter])

  useEffect(() => { load() }, [load])

  const handleMarkRead = async (id) => {
    try {
      await notificationAPI.markRead(id)
      setNotifs((prev) => prev.map((n) => n._id === id ? { ...n, isRead: true } : n))
      setUnread((u) => Math.max(0, u - 1))
    } catch {
      toast({ type: 'error', message: 'Failed to mark as read' })
    }
  }

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllRead()
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })))
      setUnread(0)
      toast({ type: 'success', message: 'All marked as read' })
    } catch {
      toast({ type: 'error', message: 'Failed to mark all as read' })
    }
  }

  const handleDelete = async (id) => {
    try {
      await notificationAPI.delete(id)
      const deleted = notifs.find((n) => n._id === id)
      setNotifs((prev) => prev.filter((n) => n._id !== id))
      setTotal((t) => t - 1)
      if (!deleted?.isRead) setUnread((u) => Math.max(0, u - 1))
    } catch {
      toast({ type: 'error', message: 'Failed to delete' })
    }
  }

  return (
    <div className="page-container py-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Bell className="h-6 w-6" /> Notifications
            {unread > 0 && (
              <span className="inline-flex items-center justify-center h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold min-w-[20px]">
                {unread}
              </span>
            )}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loading ? '…' : `${total} notification${total !== 1 ? 's' : ''}`}
          </p>
        </div>

        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2">
            <CheckCheck className="h-4 w-4" /> Mark all read
          </Button>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {['all', 'unread'].map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setPage(1) }}
            className={cn(
              'px-4 py-1.5 rounded-full text-sm font-medium border capitalize transition-colors',
              filter === f
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
            )}
          >
            {f === 'unread' ? `Unread${unread > 0 ? ` (${unread})` : ''}` : 'All'}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : notifs.length === 0 ? (
        <div className="text-center py-24 bg-card border border-border rounded-xl">
          <Bell className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
          <h3 className="font-semibold text-foreground mb-1">
            {filter === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          </h3>
          <p className="text-sm text-muted-foreground">
            {filter === 'unread' ? "You're all caught up!" : 'Activity on your account will appear here.'}
          </p>
          {filter === 'unread' && (
            <button onClick={() => setFilter('all')} className="text-primary text-sm hover:underline mt-2 block mx-auto">
              View all notifications
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {notifs.map((n) => (
            <NotificationItem
              key={n._id}
              notif={n}
              onMarkRead={handleMarkRead}
              onDelete={handleDelete}
            />
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