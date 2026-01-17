import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'

export const useTemplateTool = tool(
  async (input: {
    templatePath: string
  }, context: any) => {
    try {
      if (!fs.existsSync(input.templatePath)) {
        throw new Error(`Template file not found: ${input.templatePath}`)
      }
      
      return {
        success: true,
        message: `Template loaded successfully. Use template-based tools (rearrange_slides, replace_text) with this template path.`,
        templatePath: input.templatePath,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to load template: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_use_template',
    description: 'Load a template PPTX file for template-based editing workflow. Returns the template path to use with other template tools.',
    schema: z.object({
      templatePath: z.string().describe('Path to template PPTX file to use as base'),
    }),
  }
)
