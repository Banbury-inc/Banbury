import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../utils"

const inputVariants = cva(
  "file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground border-input flex w-full min-w-0 rounded-md border bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default: "dark:bg-input/30 md:text-sm",
        ghost: "border-0 shadow-none bg-transparent focus-visible:ring-0 focus-visible:border-0",
        outline: "bg-background dark:bg-input/20 dark:border-input",
        primary: "w-full pl-8 pr-3 py-1 bg-accent border-0 rounded-md text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm",
        primaryBlack: "bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2.5 text-white placeholder-zinc-500 hover:border-zinc-600 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50 transition-all"
      },
      inputSize: {
        default: "h-9 px-3 py-1",
        sm: "h-8 px-2 py-1 text-sm",
        lg: "h-10 px-4 py-2",
      },
    },
    defaultVariants: {
      variant: "default",
      inputSize: "default",
    },
  }
)

interface InputProps extends React.ComponentProps<"input">, VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, variant, inputSize, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        data-slot="input"
        className={cn(inputVariants({ variant, inputSize, className }))}
        {...props}
      />
    )
  }
)

Input.displayName = "Input"

export { Input, inputVariants }
