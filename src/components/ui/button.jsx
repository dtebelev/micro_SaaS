import * as React from "react"
import { cva } from "class-variance-authority";
import { Slot } from "radix-ui"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-sm font-bold whitespace-nowrap transition-all outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        // Главный CTA — лаймовый с тёмно-зелёным текстом (по DESIGN.md)
        default:
          "bg-lime-accent text-deep-forest shadow-cta hover:bg-hover-lime hover:-translate-y-0.5",
        // Тёмно-зелёная заливка
        forest:
          "bg-deep-forest text-off-white shadow-card hover:bg-primary-container",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90",
        // Ghost-контур в лесном зелёном
        outline:
          "border border-primary/40 bg-transparent text-primary hover:bg-light-sage/50",
        secondary:
          "bg-light-sage text-secondary border border-muted-border hover:bg-light-sage/70",
        ghost:
          "text-primary hover:bg-light-sage/50",
        link: "text-primary underline-offset-4 hover:underline rounded-none",
      },
      size: {
        default: "h-11 px-6 py-2 has-[>svg]:px-5",
        xs: "h-7 gap-1 px-3 text-xs has-[>svg]:px-2.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-9 gap-1.5 px-4 has-[>svg]:px-3",
        lg: "h-[60px] px-8 text-base has-[>svg]:px-6",
        icon: "size-11",
        "icon-sm": "size-9",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props} />
  );
}

export { Button, buttonVariants }
