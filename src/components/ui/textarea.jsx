import * as React from 'react'
import { cn } from '@/lib/utils'

const Textarea = React.forwardRef(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    data-slot="textarea"
    className={cn(
      'flex w-full rounded-lg border border-muted-border bg-white p-5 text-base leading-relaxed text-on-surface',
      'placeholder:text-outline-variant outline-none transition-all resize-none',
      'focus:border-transparent focus:ring-2 focus:ring-deep-forest',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:ring-destructive/30',
      className,
    )}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

export { Textarea }
