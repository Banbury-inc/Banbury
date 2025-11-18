import type { Meta, StoryObj } from "@storybook/react"
import { SheetAITool } from "frontend/components/RightPanel/composer/components/SheetAITool"

const meta: Meta<typeof SheetAITool> = {
  title: "AI Tools/SheetAITool",
  component: SheetAITool,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof SheetAITool>

export const WithOperations: Story = {
  args: {
    args: {
      action: "Update spreadsheet",
      sheetName: "Sales Data.xlsx",
      operations: [
        { type: "setCell", row: 0, col: 0, value: "Product" },
        { type: "setCell", row: 0, col: 1, value: "Revenue" },
        { type: "setCell", row: 1, col: 0, value: "Widget A" },
        { type: "setCell", row: 1, col: 1, value: 1500 },
        { type: "setCell", row: 2, col: 0, value: "Widget B" },
        { type: "setCell", row: 2, col: 1, value: 2300 }
      ],
      note: "Adding product revenue data"
    }
  }
}

export const WithCSVContent: Story = {
  args: {
    args: {
      action: "Import CSV data",
      sheetName: "Budget.xlsx",
      csvContent: "Category,Amount\nSalaries,50000\nOffice,10000\nMarketing,15000",
      note: "Importing budget data from CSV"
    }
  }
}

export const MultipleOperations: Story = {
  args: {
    args: {
      action: "Restructure spreadsheet",
      sheetName: "Q4 Report.xlsx",
      operations: [
        { type: "insertRows", index: 0, count: 2 },
        { type: "setRange", range: { startRow: 0, startCol: 0, endRow: 1, endCol: 2 }, values: [["Q4", "2024", "Final"], ["Month", "Sales", "Costs"]] },
        { type: "deleteRows", index: 10, count: 3 }
      ],
      note: "Restructuring quarterly report"
    }
  }
}

export const SimpleUpdate: Story = {
  args: {
    args: {
      action: "Update values",
      sheetName: "Inventory.xlsx",
      operations: [
        { type: "setCell", row: 5, col: 3, value: 125 }
      ]
    }
  }
}

export const WithoutContent: Story = {
  args: {
    args: {
      action: "Empty operation",
      sheetName: "Empty.xlsx",
      operations: []
    }
  }
}

