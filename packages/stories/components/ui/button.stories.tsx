import type { Meta, StoryObj } from "@storybook/react"
import { Button } from "frontend/components/ui/button"

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  args: {
    children: "Button"
  },
  tags: ["autodocs"]
}

export default meta

type Story = StoryObj<typeof Button>

export const Default: Story = {}

export const Primary: Story = {
  args: { variant: "primary" }
}

export const Destructive: Story = {
  args: { variant: "destructive" }
}

export const Outline: Story = {
  args: { variant: "outline" }
}

export const Ghost: Story = {
  args: { variant: "ghost" }
}

export const Link: Story = {
  args: { variant: "link" }
}

export const Small: Story = {
  args: { size: "sm" }
}

export const Large: Story = {
  args: { size: "lg" }
}

