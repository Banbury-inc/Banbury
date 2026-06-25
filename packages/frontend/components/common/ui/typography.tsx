import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../../utils"

const typographyVariants = cva("font-mono", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-bold tracking-tight lg:text-5xl text-foreground",
      h2: "scroll-m-20 text-2xl font-bold tracking-tight first:mt-0 text-foreground",
      h3: "scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
      h4: "scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
      p: "leading-7 [&:not(:first-child)]:mt-6 text-foreground",
      blockquote: "mt-6 border-l-2 italic text-foreground",
      list: "my-6 ml-6 list-disc [&>li]:mt-2 text-foreground",
      inlineCode:
        "relative rounded bg-muted font-mono text-sm font-semibold text-foreground",
      lead: "text-xl text-muted-foreground",
      large: "text-lg font-semibold text-foreground",
      small: "text-sm font-medium leading-none text-foreground",
      xs: "text-xs font-medium leading-none text-foreground",
      muted: "text-sm text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "p",
  },
})

interface TypographyProps
  extends React.HTMLAttributes<HTMLElement>,
    VariantProps<typeof typographyVariants> {
  asChild?: boolean
}

const Typography = React.forwardRef<HTMLElement, TypographyProps>(
  ({ className, variant, asChild = false, ...props }, ref) => {
    const elementMap = {
      h1: "h1",
      h2: "h2",
      h3: "h3",
      h4: "h4",
      p: "p",
      blockquote: "blockquote",
      list: "ul",
      inlineCode: "code",
      lead: "p",
      large: "div",
      small: "small",
      xs: "small",
      muted: "p",
    } as const

    const Comp = asChild
      ? "span"
      : (elementMap[variant as keyof typeof elementMap] || "p")

    return (
      <Comp
        ref={ref as any}
        data-typography-variant={variant}
        className={cn(typographyVariants({ variant, className }))}
        {...(props as any)}
      />
    )
  }
)

Typography.displayName = "Typography"

export { Typography, typographyVariants }

