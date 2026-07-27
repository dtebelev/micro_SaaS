import * as React from 'react'
import { cn } from '@/lib/utils'

const Input = React.forwardRef(({ className, type = 'text', ...props }, ref) => (
  <input
    ref={ref}
    type={type}
    data-slot="input"
    className={cn(
      'flex h-12 w-full rounded-lg border border-muted-border bg-off-white px-4 py-2 text-base text-on-surface',
      'placeholder:text-outline-variant outline-none transition-all',
      'focus:border-transparent focus:ring-2 focus:ring-deep-forest',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30',
      className,
    )}
    {...props}
  />
))
Input.displayName = 'Input'

export { Input }
