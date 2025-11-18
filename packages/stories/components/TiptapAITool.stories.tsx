import type { Meta, StoryObj } from "@storybook/react"
import { TiptapAITool } from "frontend/components/RightPanel/composer/components/TiptapAITool"

const meta: Meta<typeof TiptapAITool> = {
  title: "AI Tools/TiptapAITool",
  component: TiptapAITool,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof TiptapAITool>

export const Rewrite: Story = {
  args: {
    args: {
      action: "Rewrite paragraph",
      content: "<p>This paragraph has been rewritten to be more concise and clear. The main points remain the same, but the language is more professional and easier to understand.</p>",
      actionType: "rewrite",
      selection: {
        from: 10,
        to: 150,
        text: "Original text that needs to be rewritten for clarity"
      }
    }
  }
}

export const Correct: Story = {
  args: {
    args: {
      action: "Correct grammar",
      content: "<p>The document has been reviewed and all grammatical errors have been corrected. Punctuation and sentence structure have been improved for better readability.</p>",
      actionType: "correct",
      selection: {
        from: 0,
        to: 200,
        text: "Document with grammar errors needs corrections"
      }
    }
  }
}

export const Expand: Story = {
  args: {
    args: {
      action: "Expand content",
      content: "<p>This is the original brief statement.</p><p>Here is additional context and detail that helps explain the concept more thoroughly. We've added examples and supporting information to make the content more comprehensive and informative for the reader.</p>",
      actionType: "expand",
      selection: {
        from: 50,
        to: 100,
        text: "Brief statement"
      }
    }
  }
}

export const Translate: Story = {
  args: {
    args: {
      action: "Translate to Spanish",
      content: "<p>Hola, este es un ejemplo de texto traducido al español. El contenido mantiene el significado original mientras está adaptado al idioma objetivo.</p>",
      actionType: "translate",
      language: "Spanish",
      selection: {
        from: 0,
        to: 100,
        text: "Hello, this is sample text to translate"
      }
    }
  }
}

export const Summarize: Story = {
  args: {
    args: {
      action: "Summarize text",
      content: "<p><strong>Summary:</strong> This document discusses key project milestones, budget considerations, and team responsibilities. Main focus is on Q4 deliverables.</p>",
      actionType: "summarize",
      selection: {
        from: 0,
        to: 500,
        text: "Long document text that needs to be summarized..."
      }
    }
  }
}

export const Outline: Story = {
  args: {
    args: {
      action: "Create outline",
      content: "<h2>1. Introduction</h2><ul><li>Background</li><li>Purpose</li></ul><h2>2. Main Content</h2><ul><li>Key Points</li><li>Analysis</li></ul><h2>3. Conclusion</h2>",
      actionType: "outline"
    }
  }
}

export const Insert: Story = {
  args: {
    args: {
      action: "Insert content",
      content: "<p>This is newly generated content that will be inserted at the cursor position. It provides relevant information based on the context of the document.</p>",
      actionType: "insert"
    }
  }
}

export const NoContent: Story = {
  args: {
    args: {
      action: "Empty action",
      content: "",
      actionType: "rewrite"
    }
  }
}

