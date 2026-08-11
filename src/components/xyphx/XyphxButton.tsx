import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const xyphxButtonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-xyphx-purple focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-xyphx-purple text-white shadow-sm hover:bg-xyphx-purple-dark hover:-translate-y-0.5 border border-transparent hover:border-xyphx-warm/50",
        secondary:
          "bg-transparent border border-xyphx-border text-xyphx-text hover:bg-xyphx-purple/5 hover:border-xyphx-purple/30 hover:text-xyphx-purple",
        ghost: "hover:bg-xyphx-purple/5 hover:text-xyphx-purple text-xyphx-muted",
        link: "text-xyphx-purple underline-offset-4 hover:underline",
      },
      size: {
        default: "h-11 px-6 py-2",
        sm: "h-9 rounded-lg px-4 text-xs",
        lg: "h-12 rounded-xl px-8",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface XyphxButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof xyphxButtonVariants> {
  asChild?: boolean
}

const XyphxButton = React.forwardRef<HTMLButtonElement, XyphxButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(xyphxButtonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
XyphxButton.displayName = "XyphxButton"

export { XyphxButton, xyphxButtonVariants }
