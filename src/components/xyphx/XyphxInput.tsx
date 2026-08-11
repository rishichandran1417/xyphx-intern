import * as React from "react"
import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const XyphxInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-xl border border-xyphx-border bg-white/75 px-4 py-2 text-sm text-xyphx-text transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-xyphx-muted focus-visible:outline-none focus-visible:border-xyphx-purple focus-visible:ring-4 focus-visible:ring-xyphx-purple/10 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
XyphxInput.displayName = "XyphxInput"

export { XyphxInput }
