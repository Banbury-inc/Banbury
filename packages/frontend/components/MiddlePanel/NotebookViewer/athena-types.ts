// Minimal mirror of Athena notebook types for nbformat compatibility
import type nbformat from '@jupyterlab/nbformat'

export interface ITab {
  id: string
  label: string
  path?: string
  visible?: boolean
}

export interface IFile {
  path: string
  name: string
  type: 'notebook' | 'directory' | 'file'
}

export interface IDirectoryModel {
  files: IFile[]
  path: string
}

export interface INotebookData {
  content: nbformat.INotebookContent
  path: string
}

export namespace Cell {
  export function isCode(cell: nbformat.ICell): cell is nbformat.ICodeCell {
    return cell.cell_type === 'code'
  }
}


