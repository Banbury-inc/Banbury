export interface SkillsStreamRequestBody {
  messages: any[]
  toolPreferences?: {
    model_id?: string
    model_provider?: string
    use_skills?: boolean
  }
  dateTimeContext?: {
    formatted: string
    isoString: string
  }
  documentContext?: any
}

export interface FileGeneratedEvent {
  type: 'file-generated'
  fileType: 'pptx' | 'docx' | 'xlsx' | 'pdf'
  fileId: string
  fileName: string
  downloadUrl?: string
}

export interface FileMetadata {
  id: string
  filename: string
  size: number
  type: string
}
