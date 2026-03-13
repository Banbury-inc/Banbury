export interface CodeEditOperation {
  description?: string
  originalSnippet: string
  replacementSnippet: string
}

export interface CodeEditProposal {
  changeId: string
  filePath: string
  fileName?: string | null
  summary: string
  edits: CodeEditOperation[]
  confidence?: number
}

export interface CodeEditToolResultEnvelope {
  success: boolean
  type?: string
  proposal?: CodeEditProposal
  message?: string
}

export interface CodeEditProposalEventDetail extends CodeEditProposal {
  preview?: boolean
}
