import { tool } from "@langchain/core/tools"
import { z } from "zod"
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { extractTextInventory } from '../../skills/pptx/utils/inventory'
import { applyReplacementsToFile, validateReplacements, ReplacementData } from '../../skills/pptx/utils/replace'
import { uploadFileToS3 } from '../pptxUtils'
import { getAuthToken } from '../pptxUtils'
import { getServerContextValue } from '../../../../../../../frontend/assistant/langraph/serverContext'

export const replaceTextTool = tool(
  async (input: {
    templatePath: string
    replacements: ReplacementData
    outputPath?: string
  }, context: any) => {
    try {
      if (!fs.existsSync(input.templatePath)) {
        throw new Error(`Template file not found: ${input.templatePath}`)
      }
      
      // Extract inventory
      const inventory = await extractTextInventory(input.templatePath)
      
      // Validate replacements
      const validationErrors = validateReplacements(inventory, input.replacements)
      if (validationErrors.length > 0) {
        console.warn('Replacement validation warnings:', validationErrors)
      }
      
      const tmpDir = os.tmpdir()
      const outputPath = input.outputPath || path.join(tmpDir, `replaced_${Date.now()}.pptx`)
      
      const result = await applyReplacementsToFile(input.templatePath, input.replacements, inventory, outputPath)
      
      if (!result.success) {
        throw new Error(`Failed to apply replacements: ${result.message}`)
      }
      
      // Upload to S3
      const authToken = getAuthToken(context)
      const uploadResult = await uploadFileToS3(outputPath, authToken, 'presentations')

      // Clean up temp file
      try {
        fs.unlinkSync(outputPath)
      } catch {
        // Ignore cleanup errors
      }

      if (!uploadResult) {
        throw new Error('Failed to upload presentation to cloud storage')
      }

      // Emit event for PowerPointViewer
      const sendEvent = getServerContextValue<Function>("sendEvent")
      const fileName = path.basename(input.templatePath)
      if (sendEvent && uploadResult.fileInfo?.file_id) {
        sendEvent({
          type: "pptx-updated",
          fileId: uploadResult.fileInfo.file_id,
          fileName: fileName,
          operation: "replace_text",
          timestamp: Date.now()
        })
      }

      return {
        success: true,
        message: `Successfully replaced text in template`,
        templatePath: input.templatePath,
        outputPath: outputPath,
        fileUrl: uploadResult.fileUrl,
        fileInfo: uploadResult.fileInfo,
        fileId: uploadResult.fileInfo?.file_id,
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Failed to replace text: ${error.message}`,
        error: error.message
      }
    }
  },
  {
    name: 'pptx_replace_text',
    description: 'Replace text in a template with new content. Requires a template loaded with use_template first.',
    schema: z.object({
      templatePath: z.string().describe('Path to template PPTX file'),
      replacements: z.any().describe('Replacement data object mapping placeholder text to new content'),
      outputPath: z.string().optional().describe('Optional output path for modified presentation'),
    }),
  }
)
