import * as React from "react"

import { cn } from "frontend/lib/utils"

const inputVariantClassNames = {
  default: "bg-transparent dark:bg-input/30",
  ghost: "border-transparent bg-transparent shadow-none focus-visible:border-transparent focus-visible:ring-0",
  muted: "border-transparent bg-muted/50 shadow-none hover:bg-muted/60",
  outline: "bg-background dark:bg-input/20",
}

interface InputProps extends React.ComponentProps<"input"> {
  variant?: "default" | "ghost" | "muted" | "outline"
}

function Input({ className, type, variant = "default", ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input h-9 w-full min-w-0 rounded-md border px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        inputVariantClassNames[variant],
        className
      )}
      {...props}
    />
  )
}

export { Input }
