import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatSalary(salary) {
  if (!salary || salary.isHidden) return 'Not disclosed'
  const fmt = (n) => n >= 100000
    ? `₹${(n / 100000).toFixed(n % 100000 === 0 ? 0 : 1)}L`
    : `₹${n.toLocaleString()}`
  if (salary.min && salary.max) return `${fmt(salary.min)} – ${fmt(salary.max)}`
  if (salary.max) return `Up to ${fmt(salary.max)}`
  if (salary.min) return `From ${fmt(salary.min)}`
  return 'Not disclosed'
}

export function timeAgo(date) {
  const seconds = Math.floor((new Date() - new Date(date)) / 1000)
  if (seconds < 60)     return 'just now'
  if (seconds < 3600)   return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400)  return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDate(date) {
  if (!date) return '—'
  return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function getInitials(name = '') {
  return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
}

export const STATUS_COLORS = {
  pending:     'status-pending',
  active:      'status-active',
  reviewed:    'status-reviewed',
  shortlisted: 'status-shortlisted',
  rejected:    'status-rejected',
  hired:       'status-hired',
  closed:      'status-closed',
}

export const JOB_TYPE_COLORS = {
  'Full-time':  'badge-blue',
  'Part-time':  'badge-purple',
  'Contract':   'badge-yellow',
  'Internship': 'badge-green',
  'Freelance':  'badge-gray',
}