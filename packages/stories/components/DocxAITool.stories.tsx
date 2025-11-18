import type { Meta, StoryObj } from "@storybook/react"
import { DocxAITool } from "frontend/components/RightPanel/composer/components/DocxAITool"

const meta: Meta<typeof DocxAITool> = {
  title: "AI Tools/DocxAITool",
  component: DocxAITool,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof DocxAITool>

export const InsertText: Story = {
  args: {
    args: {
      action: "Insert introduction",
      documentName: "Report.docx",
      operations: [
        { type: "insertParagraph", position: 0, text: "Executive Summary", style: "Heading1" },
        { type: "insertParagraph", position: 1, text: "This report provides an overview of Q4 performance metrics." }
      ],
      note: "Adding executive summary section"
    }
  }
}

export const WithHTMLContent: Story = {
  args: {
    args: {
      action: "Insert formatted content",
      documentName: "Proposal.docx",
      htmlContent: "<h1>Project Proposal</h1><p>This proposal outlines the scope and timeline for the new project.</p><ul><li>Phase 1: Planning</li><li>Phase 2: Development</li><li>Phase 3: Testing</li></ul>",
      note: "Adding project proposal content"
    }
  }
}

export const FormatText: Story = {
  args: {
    args: {
      action: "Format document",
      documentName: "Contract.docx",
      operations: [
        { type: "formatText", startPosition: 0, endPosition: 20, formatting: { bold: true, fontSize: 14 } },
        { type: "formatText", startPosition: 100, endPosition: 150, formatting: { italic: true, color: "#FF0000" } }
      ],
      note: "Applying text formatting"
    }
  }
}

export const InsertTable: Story = {
  args: {
    args: {
      action: "Add data table",
      documentName: "Analysis.docx",
      operations: [
        {
          type: "insertTable",
          position: 50,
          rows: [
            ["Metric", "Q3", "Q4"],
            ["Revenue", "$100K", "$150K"],
            ["Expenses", "$60K", "$70K"],
            ["Profit", "$40K", "$80K"]
          ],
          hasHeaders: true
        }
      ],
      note: "Inserting quarterly comparison table"
    }
  }
}

export const ReplaceText: Story = {
  args: {
    args: {
      action: "Update content",
      documentName: "Letter.docx",
      operations: [
        { type: "replaceText", startPosition: 10, endPosition: 30, text: "Dear Valued Customer," },
        { type: "replaceParagraph", paragraphIndex: 2, text: "We appreciate your continued business and loyalty." }
      ],
      note: "Updating letter salutation and body"
    }
  }
}

export const EmptyDocument: Story = {
  args: {
    args: {
      action: "Empty operation",
      documentName: "Empty.docx",
      operations: []
    }
  }
}

