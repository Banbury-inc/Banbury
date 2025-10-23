import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Tldraw canvas AI tool for reading, editing, and modifying canvas files
export const tldrawAiTool = tool(
  async (input: {
    action: string
    canvasName?: string
    operations?: Array<
      | { type: 'createShape'; shapeType: 'rectangle' | 'ellipse' | 'text' | 'note' | 'arrow' | 'line'; x: number; y: number; width?: number; height?: number; text?: string; color?: string; note?: string }
      | { type: 'updateShape'; shapeId: string; x?: number; y?: number; width?: number; height?: number; text?: string; color?: string; note?: string }
      | { type: 'deleteShape'; shapeId: string }
      | { type: 'moveShape'; shapeId: string; x: number; y: number }
      | { type: 'addText'; shapeId: string; text: string }
      | { type: 'connectShapes'; fromShapeId: string; toShapeId: string; arrowType?: 'arrow' | 'line' }
      | { type: 'groupShapes'; shapeIds: string[]; groupName?: string }
      | { type: 'ungroupShapes'; groupId: string }
      | { type: 'duplicateShape'; shapeId: string; offsetX?: number; offsetY?: number }
      | { type: 'setCanvasBackground'; color?: string; pattern?: string }
      | { type: 'addAnnotation'; x: number; y: number; text: string; type?: 'comment' | 'highlight' }
    >
    canvasData?: any
    note?: string
  }) => {
    return {
      action: input.action,
      canvasName: input.canvasName,
      operations: input.operations,
      canvasData: input.canvasData,
      note: input.note,
    }
  },
  {
    name: 'tldraw_ai',
    description:
      'Use this tool to read, edit, and modify tldraw canvas files. You can create shapes, update existing ones, connect elements, and perform various canvas operations.',
    schema: z.object({
      action: z.string().describe("Description of the action performed (e.g. 'Add flowchart shapes', 'Create diagram', 'Update canvas layout', 'Connect elements')"),
      canvasName: z.string().optional().describe('Optional canvas name for context'),
      operations: z
        .array(
          z.union([
            z.object({ 
              type: z.literal('createShape'), 
              shapeType: z.enum(['rectangle', 'ellipse', 'text', 'note', 'arrow', 'line']),
              x: z.number(), 
              y: z.number(), 
              width: z.number().optional(), 
              height: z.number().optional(), 
              text: z.string().optional(),
              color: z.string().optional(),
              note: z.string().optional()
            }),
            z.object({ 
              type: z.literal('updateShape'), 
              shapeId: z.string(), 
              x: z.number().optional(), 
              y: z.number().optional(), 
              width: z.number().optional(), 
              height: z.number().optional(), 
              text: z.string().optional(),
              color: z.string().optional(),
              note: z.string().optional()
            }),
            z.object({ type: z.literal('deleteShape'), shapeId: z.string() }),
            z.object({ type: z.literal('moveShape'), shapeId: z.string(), x: z.number(), y: z.number() }),
            z.object({ type: z.literal('addText'), shapeId: z.string(), text: z.string() }),
            z.object({ 
              type: z.literal('connectShapes'), 
              fromShapeId: z.string(), 
              toShapeId: z.string(), 
              arrowType: z.enum(['arrow', 'line']).optional()
            }),
            z.object({ type: z.literal('groupShapes'), shapeIds: z.array(z.string()), groupName: z.string().optional() }),
            z.object({ type: z.literal('ungroupShapes'), groupId: z.string() }),
            z.object({ 
              type: z.literal('duplicateShape'), 
              shapeId: z.string(), 
              offsetX: z.number().optional(), 
              offsetY: z.number().optional() 
            }),
            z.object({ 
              type: z.literal('setCanvasBackground'), 
              color: z.string().optional(), 
              pattern: z.string().optional() 
            }),
            z.object({ 
              type: z.literal('addAnnotation'), 
              x: z.number(), 
              y: z.number(), 
              text: z.string(),
              type: z.enum(['comment', 'highlight']).optional()
            }),
          ])
        )
        .optional()
        .describe('Array of canvas operations to perform'),
      canvasData: z.any().optional().describe('Full canvas data for complex operations'),
      note: z.string().optional().describe('Additional notes about the canvas modifications'),
    }),
  }
)

