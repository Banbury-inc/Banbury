import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'
import { extractTextInventory } from '../../skills/pptx/utils/inventory'

export const extractInventoryTool = tool(
  async (input: {
    templatePath: string
    slideIndex?: number
  }, context: any) => {
    try {
      if (!fs.existsSync(input.templatePath)) {
        throw new Error(`Template file not found: ${input.templatePath}`)
      }
      
      const inventory = await extractTextInventory(input.templatePath)
      
      return {
        success: true,
        message: `Successfully extracted text inventory from template`,
        templatePath: input.templatePath,
        inventory: inventory,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to extract inventory: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_extract_inventory',
    description: 'Extract text inventory from a template PPTX file. This identifies all text placeholders that can be replaced.',
    schema: z.object({
      templatePath: z.string().describe('Path to template PPTX file'),
      slideIndex: z.number().optional().describe('Optional slide index to extract inventory from specific slide'),
    }),
  }
)
