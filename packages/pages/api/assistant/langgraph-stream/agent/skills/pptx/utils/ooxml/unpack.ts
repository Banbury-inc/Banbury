/**
 * OOXML Unpack Utility
 * 
 * Extracts PPTX ZIP files and pretty-prints XML contents for easier editing.
 * 
 * Based on the Python implementation from the skills repo.
 */

import * as fs from 'fs'
import * as path from 'path'
import JSZip from 'jszip'
import { parseString } from 'xml2js'
import { format } from 'xml-formatter'
import { UnpackOptions } from './types'

/**
 * Unpack a PPTX file to a directory with pretty-printed XML files
 * 
 * @param inputFile - Path to the input PPTX file or Buffer containing PPTX data
 * @param outputDir - Path to the output directory
 * @param options - Unpack options
 */
export async function unpackPptx(
  inputFile: string | Buffer,
  outputDir: string,
  options: UnpackOptions = {}
): Promise<void> {
  const { prettyPrint = true } = options

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  // Read PPTX file
  const pptxData = typeof inputFile === 'string' 
    ? fs.readFileSync(inputFile)
    : inputFile

  // Extract ZIP contents
  const zip = await JSZip.loadAsync(pptxData)
  
  // Extract all files
  const filePromises: Promise<void>[] = []
  
  zip.forEach((relativePath, file) => {
    if (file.dir) {
      // Create directory
      const dirPath = path.join(outputDir, relativePath)
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }
    } else {
      // Extract file
      const filePath = path.join(outputDir, relativePath)
      const dirPath = path.dirname(filePath)
      
      // Ensure parent directory exists
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true })
      }

      // Handle XML files specially
      const isXmlFile = relativePath.endsWith('.xml') || relativePath.endsWith('.rels')
      
      if (isXmlFile && prettyPrint) {
        filePromises.push(
          file.async('string').then(async (content) => {
            try {
              // Parse XML to ensure it's valid
              await new Promise<void>((resolve, reject) => {
                parseString(content, { trim: false }, (err) => {
                  if (err) reject(err)
                  else resolve()
                })
              })

              // Format the XML with pretty-printing
              const formatted = format(content, {
                indentation: '  ',
                filter: (node) => node.type !== 'Comment',
                collapseContent: true,
                lineSeparator: '\n'
              })

              fs.writeFileSync(filePath, formatted, 'utf-8')
            } catch (error) {
              // If formatting fails, write original content
              console.warn(`Failed to format XML file ${relativePath}:`, error)
              fs.writeFileSync(filePath, content, 'utf-8')
            }
          })
        )
      } else if (isXmlFile && !prettyPrint) {
        // Extract XML files without formatting
        filePromises.push(
          file.async('string').then((content) => {
            fs.writeFileSync(filePath, content, 'utf-8')
          })
        )
      } else {
        // Extract binary files as-is
        filePromises.push(
          file.async('nodebuffer').then((buffer) => {
            fs.writeFileSync(filePath, buffer)
          })
        )
      }
    }
  })

  await Promise.all(filePromises)
}
