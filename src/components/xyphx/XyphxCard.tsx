import * as React from "react"
import { cn } from "@/lib/utils"

const XyphxCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-[20px] border border-xyphx-border bg-white/80 backdrop-blur-sm text-xyphx-text shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md hover:border-xyphx-border-strong",
      className
    )}
    {...props}
  />
))
XyphxCard.displayName = "XyphxCard"

const XyphxCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-6", className)}
    {...props}
  />
))
XyphxCardHeader.displayName = "XyphxCardHeader"

const XyphxCardTitle = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("xyphx-heading text-xl", className)}
    {...props}
  />
))
XyphxCardTitle.displayName = "XyphxCardTitle"

const XyphxCardDescription = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("text-sm text-xyphx-muted", className)}
    {...props}
  />
))
XyphxCardDescription.displayName = "XyphxCardDescription"

const XyphxCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
XyphxCardContent.displayName = "XyphxCardContent"

const XyphxCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
XyphxCardFooter.displayName = "XyphxCardFooter"

export { XyphxCard, XyphxCardHeader, XyphxCardFooter, XyphxCardTitle, XyphxCardDescription, XyphxCardContent }
