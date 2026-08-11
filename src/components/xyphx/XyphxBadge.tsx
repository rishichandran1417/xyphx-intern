import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const xyphxBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-xyphx-purple focus:ring-offset-2 xyphx-mono",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-xyphx-purple text-white shadow hover:bg-xyphx-purple-dark",
        secondary:
          "border-transparent bg-slate-100 text-slate-900 hover:bg-slate-200",
        outline: "text-xyphx-text border-xyphx-border",
        success: "border-transparent bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/20",
        warning: "border-transparent bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/20",
        danger: "border-transparent bg-red-500/10 text-red-700 border-red-500/20 hover:bg-red-500/20",
        info: "border-transparent bg-xyphx-purple/10 text-xyphx-purple border-xyphx-purple/20 hover:bg-xyphx-purple/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface XyphxBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof xyphxBadgeVariants> {}

function XyphxBadge({ className, variant, ...props }: XyphxBadgeProps) {
  return (
    <div className={cn(xyphxBadgeVariants({ variant }), className)} {...props} />
  )
}

export { XyphxBadge, xyphxBadgeVariants }
