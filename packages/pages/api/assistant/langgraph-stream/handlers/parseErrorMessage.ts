interface ParseErrorMessageParams {
  error: any
}

export function parseErrorMessage({ error }: ParseErrorMessageParams): string {
  const baseMessage = error?.message || "unknown error"
  
  // Parse Anthropic-specific errors
  if (typeof error?.message === 'string' && error.message.includes('image exceeds 5 MB maximum')) {
    try {
      const match = error.message.match(/"message":"([^"]+)"/)
      if (match && match[1]) {
        return match[1].replace(/\\"/g, '"')
      }
    } catch (parseError) {
      return "File size exceeds 5 MB maximum limit"
    }
  }
  
  return baseMessage
}

