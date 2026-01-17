import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { rearrangePresentation } from '../../skills/pptx/utils/rearrange'

export const rearrangeSlidesTool = tool(
  async (input: {
    templatePath: string
    sequence: number[]
    outputPath?: string
  }, context: any) => {
    try {
      if (!fs.existsSync(input.templatePath)) {
        throw new Error(`Template file not found: ${input.templatePath}`)
      }
      
      const tmpDir = os.tmpdir()
      const outputPath = input.outputPath || path.join(tmpDir, `rearranged_${Date.now()}.pptx`)
      
      await rearrangePresentation(input.templatePath, outputPath, input.sequence)
      
      return {
        success: true,
        message: `Successfully rearranged slides according to sequence`,
        templatePath: input.templatePath,
        outputPath: outputPath,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to rearrange slides: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_rearrange_slides',
    description: 'Rearrange slides in a template according to a sequence. Requires a template loaded with use_template first.',
    schema: z.object({
      templatePath: z.string().describe('Path to template PPTX file'),
      sequence: z.array(z.number()).describe('Array of slide indices in desired order (0-indexed)'),
      outputPath: z.string().optional().describe('Optional output path for rearranged presentation'),
    }),
  }
)
