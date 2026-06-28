import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Search, Shield, Ban, Trash2, ChevronLeft, ChevronRight,
  User, Building2, AlertCircle, CheckCircle, XCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Spinner } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { adminAPI } from '@/api/services'
import { cn, timeAgo, getInitials } from '@/lib/utils'

const ROLES = ['all', 'seeker', 'employer', 'admin']
const ROLE_COLORS = { seeker: 'badge-blue', employer: 'badge-purple', admin: 'badge-gray' }
const ROLE_ICONS  = { seeker: User, employer: Building2, admin: Shield }

function ConfirmModal({ title, message, confirmLabel, danger, onConfirm, onClose }) {
  const [loading, setLoading] = useState(false)
  const handleConfirm = async () => {
    setLoading(true)
    await onConfirm()
    setLoading(false)
  }
  return (
    <Modal open onClose={onClose} title={title}>
      <p className="text-sm text-muted-foreground mb-6">{message}</p>
      <div className="flex gap-2 justify-end">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          onClick={handleConfirm}
          disabled={loading}
          className={danger ? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground' : ''}
        >
          {loading ? 'Processing…' : confirmLabel}
        </Button>
      </div>
    </Modal>
  )
}

function UserRow({ user, onBan, onDelete }) {
  const RoleIcon = ROLE_ICONS[user.role] || User
  return (
    <div className="flex items-center gap-4 px-5 py-4 hover:bg-muted/30 transition-colors">
      {/* Avatar */}
      <div className="h-9 w-9 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center shrink-0 overflow-hidden">
        {user.avatar
          ? <img src={user.avatar} alt="" className="h-9 w-9 object-cover rounded-full" />
          : getInitials(user.name)
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
          {user.isBanned && (
            <span className="badge badge-red">Banned</span>
          )}
          {!user.isVerified && (
            <span className="badge badge-yellow">Unverified</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        <p className="text-xs text-muted-foreground mt-0.5">Joined {timeAgo(user.createdAt)}</p>
      </div>

      {/* Role */}
      <span className={cn('badge capitalize shrink-0 flex items-center gap-1', ROLE_COLORS[user.role])}>
        <RoleIcon className="h-3 w-3" />
        {user.role}
      </span>

      {/* Actions */}
      {user.role !== 'admin' && (
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost" size="icon"
            title={user.isBanned ? 'Unban user' : 'Ban user'}
            className={cn(
              'text-muted-foreground',
              user.isBanned ? 'hover:text-green-600' : 'hover:text-yellow-600'
            )}
            onClick={() => onBan(user)}
          >
            {user.isBanned ? <CheckCircle className="h-4 w-4" /> : <Ban className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost" size="icon"
            title="Delete user"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(user)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AdminUsersPage() {
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [users, setUsers]     = useState([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [search, setSearch]   = useState(searchParams.get('search') || '')
  const [role, setRole]       = useState(searchParams.get('role') || 'all')
  const [page, setPage]       = useState(1)

  const [banTarget, setBanTarget]       = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)

  const limit = 15
  const totalPages = Math.ceil(total / limit)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const params = { page, limit }
      if (role !== 'all') params.role = role
      if (search.trim()) params.search = search.trim()
      const { data } = await adminAPI.getUsers(params)
      setUsers(data.users || [])
      setTotal(data.pagination?.total || 0)
    } catch {
      setUsers([])
    } finally {
      setLoading(false)
    }
  }, [page, role, search])

  useEffect(() => { load() }, [load])

  const handleBanConfirm = async () => {
    try {
      const { data } = await adminAPI.toggleBan(banTarget._id)
      toast({ type: 'success', message: `User ${data.isBanned ? 'banned' : 'unbanned'}` })
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed' })
    } finally {
      setBanTarget(null)
    }
  }

  const handleDeleteConfirm = async () => {
    try {
      await adminAPI.deleteUser(deleteTarget._id)
      toast({ type: 'success', message: 'User deleted' })
      load()
    } catch (err) {
      toast({ type: 'error', message: err.response?.data?.message || 'Failed' })
    } finally {
      setDeleteTarget(null)
    }
  }

  return (
    <div className="page-container py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">User Management</h1>
        <p className="text-muted-foreground text-sm mt-1">View, ban, or remove users</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => { setRole(r); setPage(1) }}
              className={cn(
                'px-4 py-1.5 rounded-full text-sm font-medium capitalize border transition-colors',
                role === r
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary/50 hover:text-foreground'
              )}
            >
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        {loading ? 'Loading…' : <><span className="font-semibold text-foreground">{total}</span> user{total !== 1 ? 's' : ''}</>}
      </p>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20"><Spinner size="lg" /></div>
        ) : users.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👤</p>
            <p className="font-semibold text-foreground">No users found</p>
            <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {users.map((u) => (
              <UserRow
                key={u._id}
                user={u}
                onBan={setBanTarget}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground">Page {page} of {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {banTarget && (
        <ConfirmModal
          title={banTarget.isBanned ? 'Unban User' : 'Ban User'}
          message={
            banTarget.isBanned
              ? `Restore access for ${banTarget.name}?`
              : `Ban ${banTarget.name}? They will be logged out of all devices and cannot log in.`
          }
          confirmLabel={banTarget.isBanned ? 'Unban' : 'Ban User'}
          danger={!banTarget.isBanned}
          onConfirm={handleBanConfirm}
          onClose={() => setBanTarget(null)}
        />
      )}

      {deleteTarget && (
        <ConfirmModal
          title="Delete User"
          message={`Permanently delete ${deleteTarget.name}? All their jobs and applications will also be removed. This cannot be undone.`}
          confirmLabel="Delete Permanently"
          danger
          onConfirm={handleDeleteConfirm}
          onClose={() => setDeleteTarget(null)}
        />
      )}
    </div>
  )
}