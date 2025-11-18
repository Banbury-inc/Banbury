import type { Meta, StoryObj } from "@storybook/react"
import { TldrawAITool } from "../../frontend/components/RightPanel/composer/components/TldrawAITool"

const meta: Meta<typeof TldrawAITool> = {
  title: "AI Tools/TldrawAITool",
  component: TldrawAITool,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof TldrawAITool>

export const DrawShapes: Story = {
  args: {
    args: {
      action: "Draw shapes",
      canvasName: "Diagram.tldraw",
      operations: [
        { type: "createShape", shapeType: "rectangle", x: 100, y: 100, width: 200, height: 150 },
        { type: "createShape", shapeType: "circle", x: 400, y: 100, radius: 75 },
        { type: "createShape", shapeType: "arrow", fromX: 300, fromY: 175, toX: 400, toY: 175 }
      ],
      note: "Creating basic shapes and connections"
    }
  }
}

export const WithCanvasData: Story = {
  args: {
    args: {
      action: "Update canvas",
      canvasName: "Flowchart.tldraw",
      canvasData: {
        shapes: [
          { id: "shape1", type: "rectangle", x: 50, y: 50, props: { w: 100, h: 80, text: "Start" } },
          { id: "shape2", type: "rectangle", x: 50, y: 200, props: { w: 100, h: 80, text: "Process" } },
          { id: "arrow1", type: "arrow", bindings: { start: "shape1", end: "shape2" } }
        ]
      },
      note: "Updating flowchart"
    }
  }
}

export const ModifyShapes: Story = {
  args: {
    args: {
      action: "Modify shapes",
      canvasName: "Wireframe.tldraw",
      operations: [
        { type: "updateShape", shapeId: "shape-123", properties: { x: 150, y: 200, color: "#FF6B6B" } },
        { type: "deleteShape", shapeId: "shape-456" },
        { type: "createShape", shapeType: "text", x: 300, y: 50, text: "Header Section", fontSize: 24 }
      ],
      note: "Updating wireframe elements"
    }
  }
}

export const CreateDiagram: Story = {
  args: {
    args: {
      action: "Create system diagram",
      canvasName: "Architecture.tldraw",
      operations: [
        { type: "createShape", shapeType: "rectangle", x: 100, y: 100, width: 150, height: 100, text: "Frontend", color: "#4ECDC4" },
        { type: "createShape", shapeType: "rectangle", x: 350, y: 100, width: 150, height: 100, text: "Backend", color: "#FF6B6B" },
        { type: "createShape", shapeType: "rectangle", x: 600, y: 100, width: 150, height: 100, text: "Database", color: "#95E1D3" },
        { type: "createShape", shapeType: "arrow", fromX: 250, fromY: 150, toX: 350, toY: 150 },
        { type: "createShape", shapeType: "arrow", fromX: 500, fromY: 150, toX: 600, toY: 150 }
      ],
      note: "Creating system architecture diagram"
    }
  }
}

export const EmptyCanvas: Story = {
  args: {
    args: {
      action: "Empty canvas",
      canvasName: "New.tldraw",
      operations: []
    }
  }
}

