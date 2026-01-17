import type { Meta, StoryObj } from "@storybook/react"
import { PptxAITool } from "frontend/components/RightPanel/composer/components/PptxAITool"

const meta: Meta<typeof PptxAITool> = {
  title: "AI Tools/PptxAITool",
  component: PptxAITool,
  tags: ["autodocs"],
  parameters: {
    layout: "centered"
  }
}

export default meta

type Story = StoryObj<typeof PptxAITool>

export const CreateSlide: Story = {
  args: {
    args: {
      action: "Create new slide",
      presentationName: "Quarterly Report.pptx",
      operations: [
        { type: "createSlide", slideIndex: 0, layout: "title" },
        { type: "addText", slideIndex: 0, element: { x: 100, y: 100, width: 600, height: 100, content: "Q4 2024 Report", fontSize: 48, bold: true, align: "center" } }
      ],
      note: "Adding title slide to presentation"
    }
  }
}

export const AddTextAndShapes: Story = {
  args: {
    args: {
      action: "Add content to slide",
      presentationName: "Product Launch.pptx",
      operations: [
        { type: "createSlide", slideIndex: 1, layout: "content" },
        { type: "addText", slideIndex: 1, element: { x: 50, y: 50, width: 700, height: 60, content: "Product Features", fontSize: 36, bold: true, color: "#1a1a1a" } },
        { type: "addText", slideIndex: 1, element: { x: 50, y: 150, width: 700, height: 200, content: "• Feature 1: Advanced analytics\n• Feature 2: Real-time updates\n• Feature 3: Custom integrations", fontSize: 18, color: "#333333" } },
        { type: "addShape", slideIndex: 1, element: { x: 50, y: 400, width: 200, height: 100, shapeType: "rect", fill: "#0066cc", stroke: "#004499", strokeWidth: 2 } }
      ],
      note: "Creating content slide with text and shapes"
    }
  }
}

export const AddImage: Story = {
  args: {
    args: {
      action: "Add image to presentation",
      presentationName: "Marketing Deck.pptx",
      operations: [
        { type: "createSlide", slideIndex: 2, layout: "blank" },
        { type: "addText", slideIndex: 2, element: { x: 100, y: 50, width: 600, height: 50, content: "Company Logo", fontSize: 32, align: "center" } },
        { type: "addImage", slideIndex: 2, element: { x: 200, y: 150, width: 400, height: 300, imageUrl: "https://example.com/logo.png" } }
      ],
      note: "Adding company logo to slide"
    }
  }
}

export const UpdateElement: Story = {
  args: {
    args: {
      action: "Update slide content",
      presentationName: "Updated Presentation.pptx",
      operations: [
        { type: "updateElement", slideIndex: 0, elementId: "text-1", element: { content: "Updated Title", fontSize: 56, bold: true, color: "#0066cc" } },
        { type: "updateElement", slideIndex: 1, elementId: "shape-1", element: { fill: "#ff6600", stroke: "#cc5500", strokeWidth: 3 } }
      ],
      note: "Updating existing slide elements"
    }
  }
}

export const ReorderSlides: Story = {
  args: {
    args: {
      action: "Reorder presentation slides",
      presentationName: "Restructured Deck.pptx",
      operations: [
        { type: "reorderSlides", fromIndex: 3, toIndex: 0 },
        { type: "reorderSlides", fromIndex: 1, toIndex: 2 }
      ],
      note: "Reorganizing slide order"
    }
  }
}

export const SetBackground: Story = {
  args: {
    args: {
      action: "Apply slide background",
      presentationName: "Styled Presentation.pptx",
      operations: [
        { type: "setSlideBackground", slideIndex: 0, background: "#f0f0f0" },
        { type: "setSlideBackground", slideIndex: 1, background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }
      ],
      note: "Setting custom slide backgrounds"
    }
  }
}

export const ApplyTheme: Story = {
  args: {
    args: {
      action: "Apply presentation theme",
      presentationName: "Themed Presentation.pptx",
      operations: [
        { type: "applyTheme", theme: "corporate" },
        { type: "createSlide", slideIndex: 0, layout: "title" },
        { type: "addText", slideIndex: 0, element: { x: 100, y: 200, width: 600, height: 100, content: "Corporate Theme", fontSize: 44, align: "center" } }
      ],
      note: "Applying corporate theme to presentation"
    }
  }
}

export const MultipleOperations: Story = {
  args: {
    args: {
      action: "Comprehensive slide creation",
      presentationName: "Complete Deck.pptx",
      operations: [
        { type: "createSlide", slideIndex: 0, layout: "title" },
        { type: "addText", slideIndex: 0, element: { x: 100, y: 200, width: 600, height: 80, content: "Annual Review 2024", fontSize: 48, bold: true, align: "center", color: "#1a1a1a" } },
        { type: "createSlide", slideIndex: 1, layout: "twoColumn" },
        { type: "addText", slideIndex: 1, element: { x: 50, y: 50, width: 350, height: 50, content: "Key Metrics", fontSize: 32, bold: true } },
        { type: "addText", slideIndex: 1, element: { x: 400, y: 50, width: 350, height: 50, content: "Highlights", fontSize: 32, bold: true } },
        { type: "addShape", slideIndex: 1, element: { x: 50, y: 150, width: 300, height: 200, shapeType: "rect", fill: "#e3f2fd", stroke: "#1976d2", strokeWidth: 2 } },
        { type: "addShape", slideIndex: 1, element: { x: 400, y: 150, width: 300, height: 200, shapeType: "ellipse", fill: "#fff3e0", stroke: "#f57c00", strokeWidth: 2 } },
        { type: "setSlideBackground", slideIndex: 0, background: "#ffffff" },
        { type: "setSlideBackground", slideIndex: 1, background: "#f5f5f5" }
      ],
      note: "Creating a complete presentation with multiple slides and elements"
    }
  }
}

export const DeleteOperations: Story = {
  args: {
    args: {
      action: "Remove slide and elements",
      presentationName: "Cleaned Presentation.pptx",
      operations: [
        { type: "deleteElement", slideIndex: 1, elementId: "text-2" },
        { type: "deleteElement", slideIndex: 2, elementId: "shape-3" },
        { type: "deleteSlide", slideIndex: 5 }
      ],
      note: "Removing unwanted slides and elements"
    }
  }
}

export const EmptyPresentation: Story = {
  args: {
    args: {
      action: "Empty operation",
      presentationName: "Empty.pptx",
      operations: []
    }
  }
}
