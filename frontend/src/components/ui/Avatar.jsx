import { cn, getInitials } from '@/lib/utils'

export function Avatar({ src, name, size = 'md', className }) {
  const sizes = {
    xs:  'h-6  w-6  text-[10px]',
    sm:  'h-8  w-8  text-xs',
    md:  'h-10 w-10 text-sm',
    lg:  'h-14 w-14 text-lg',
    xl:  'h-20 w-20 text-2xl',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'avatar'}
        className={cn('rounded-full object-cover shrink-0', sizes[size], className)}
        onError={(e) => { e.target.style.display = 'none' }}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full bg-primary text-primary-foreground',
      'flex items-center justify-center font-semibold shrink-0',
      sizes[size],
      className
    )}>
      {getInitials(name)}
    </div>
  )
}