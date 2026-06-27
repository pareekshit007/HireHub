import { cn } from '@/lib/utils'

export const Card = ({ className, ...props }) => (
  <div className={cn('rounded-lg border border-border bg-card text-card-foreground shadow-sm', className)} {...props} />
)

export const CardHeader = ({ className, ...props }) => (
  <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />
)

export const CardTitle = ({ className, ...props }) => (
  <h3 className={cn('text-lg font-semibold leading-none tracking-tight', className)} {...props} />
)

export const CardContent = ({ className, ...props }) => (
  <div className={cn('p-6 pt-0', className)} {...props} />
)

export const CardFooter = ({ className, ...props }) => (
  <div className={cn('flex items-center p-6 pt-0', className)} {...props} />
)

export const Badge = ({ className, variant = 'default', ...props }) => {
  const variants = {
    default:     'bg-primary/10 text-primary',
    secondary:   'bg-secondary text-secondary-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    outline:     'border border-border text-foreground',
    success:     'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    warning:     'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  }
  return (
    <div className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors',
      variants[variant],
      className
    )} {...props} />
  )
}

export const Spinner = ({ className, size = 'md' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' }
  return (
    <div className={cn(
      'animate-spin rounded-full border-2 border-muted border-t-primary',
      sizes[size],
      className
    )} />
  )
}

export const Separator = ({ className, orientation = 'horizontal', ...props }) => (
  <div
    className={cn(
      'shrink-0 bg-border',
      orientation === 'horizontal' ? 'h-[1px] w-full' : 'h-full w-[1px]',
      className
    )}
    {...props}
  />
)

export default Card