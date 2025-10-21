import { cva, type VariantProps } from "class-variance-authority"
import * as React from "react"

import { cn } from "../../utils"

const typographyVariants = cva("font-mono", {
  variants: {
    variant: {
      h1: "scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl text-black dark:text-white",
      h2: "scroll-m-20 pb-2 text-2xl font-bold tracking-tight first:mt-0 text-black dark:text-white",
      h3: "scroll-m-20 text-xl font-semibold tracking-tight text-black dark:text-white",
      h4: "scroll-m-20 text-lg font-semibold tracking-tight text-black dark:text-white",
      p: "leading-7 [&:not(:first-child)]:mt-6 text-black dark:text-gray-300",
      blockquote: "mt-6 border-l-2 pl-6 italic text-black dark:text-gray-300",
      list: "my-6 ml-6 list-disc [&>li]:mt-2 text-black dark:text-gray-300",
      inlineCode:
        "relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold text-gray-300 dark:text-gray-300",
      lead: "text-xl text-black dark:text-gray-400",
      large: "text-lg font-semibold text-black dark:text-white",
      small: "text-sm font-medium leading-none text-black dark:text-gray-300",
      muted: "text-sm text-black dark:text-gray-400",
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

