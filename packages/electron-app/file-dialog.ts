// @ts-nocheck
import { BrowserWindow, dialog, ipcMain } from 'electron'
import fs from 'fs'
import path from 'path'

interface OpenFileDialogOptions {
  multiple?: boolean
  filters?: Array<{ name: string; extensions: string[] }>
}

interface OpenFileDialogResult {
  canceled: boolean
  files: Array<{
    name: string
    data: Buffer
    mimeType: string
  }>
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  const mimeTypes: Record<string, string> = {
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.pdf': 'application/pdf',
    '.txt': 'text/plain',
    '.csv': 'text/csv',
    '.json': 'application/json',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    '.mp4': 'video/mp4',
    '.mp3': 'audio/mpeg',
    '.zip': 'application/zip',
  }

  return mimeTypes[ext] || 'application/octet-stream'
}

export function setupFileDialogIPC(): void {
  ipcMain.handle(
    'dialog:open-files',
    async (event, options: OpenFileDialogOptions = {}): Promise<OpenFileDialogResult> => {
      const window = BrowserWindow.fromWebContents(event.sender)
      const properties: Array<'openFile' | 'multiSelections'> = ['openFile']

      if (options.multiple) {
        properties.push('multiSelections')
      }

      const result = await dialog.showOpenDialog(window ?? undefined, {
        properties,
        filters: options.filters,
      })

      if (result.canceled || result.filePaths.length === 0) {
        return { canceled: true, files: [] }
      }

      const files = await Promise.all(
        result.filePaths.map(async (filePath) => {
          const data = await fs.promises.readFile(filePath)
          return {
            name: path.basename(filePath),
            data,
            mimeType: getMimeType(filePath),
          }
        }),
      )

      return { canceled: false, files }
    },
  )
}
