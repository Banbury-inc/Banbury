import type { Meta, StoryObj } from "@storybook/react"
import * as React from "react"

import {
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport
} from "frontend/components/ui/toast"

type ToastStoryArgs = {
  variant?: React.ComponentProps<typeof Toast>["variant"]
  title: string
  description: string
  actionLabel?: string
  actionAltText?: string
}

const STAY_OPEN_DURATION = 2_147_483_647

const ToastStory = ({
  variant = "default",
  title,
  description,
  actionLabel,
  actionAltText
}: ToastStoryArgs) => {
  const [open, setOpen] = React.useState(true)

  React.useEffect(() => {
    setOpen(true)
  }, [variant, title, description, actionLabel, actionAltText])

  const handleOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        requestAnimationFrame(() => setOpen(true))
        return
      }

      setOpen(true)
    },
    [setOpen]
  )

  return (
    <ToastProvider swipeDirection="right" duration={STAY_OPEN_DURATION}>
      <div className="relative min-h-[200px] bg-muted/40 p-8">
        <Toast
          open={open}
          onOpenChange={handleOpenChange}
          variant={variant}
          duration={STAY_OPEN_DURATION}
        >
          <div className="flex flex-col gap-1 pr-6">
            <ToastTitle>{title}</ToastTitle>
            <ToastDescription>{description}</ToastDescription>
          </div>
          {actionLabel ? (
            <ToastAction altText={actionAltText ?? actionLabel}>{actionLabel}</ToastAction>
          ) : null}
          <ToastClose />
        </Toast>
        <ToastViewport className="relative right-auto top-auto mx-auto w-full max-w-[420px]" />
      </div>
    </ToastProvider>
  )
}

const meta: Meta<ToastStoryArgs> = {
  title: "UI/Toast",
  component: Toast,
  tags: ["autodocs"],
  args: {
    variant: "default",
    title: "Document created successfully",
    description: "",
    actionLabel: "",
    actionAltText: ""
  },
  render: (args) => <ToastStory {...args} />
}

export default meta

type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Success: Story = {
  args: {
    variant: "success",
    title: "Document created successfully",
    description: "",
    actionLabel: "Dismiss"
  }
}

export const Error: Story = {
  args: {
    variant: "error",
    title: "Something went wrong",
    description: "We could not complete your request. Try again later.",
    actionLabel: "Retry"
  }
}

export const Destructive: Story = {
  args: {
    variant: "destructive",
    title: "Heads up!",
    description: "Deleting this cannot be undone.",
    actionLabel: "Confirm",
    actionAltText: "Confirm destructive action"
  }
}

