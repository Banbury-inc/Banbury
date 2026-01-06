/**
 * Extract file IDs and data from code execution tool results in the response
 * Returns both file IDs for download and any embedded file data
 */
export function extractFileIds(response: any): string[] {
  const fileIds: string[] = []

  if (!response.content || !Array.isArray(response.content)) {
    console.log('[extractFileIds] No content array found')
    return fileIds
  }

  console.log('[extractFileIds] Processing blocks:', response.content.length)

  for (const block of response.content) {
    console.log('[extractFileIds] Block type:', block.type)
    console.log('[extractFileIds] Block structure:', JSON.stringify(block, null, 2))

    // Check for tool_result blocks (most common for Skills)
    if (block.type === 'tool_result') {
      console.log('[extractFileIds] Found tool_result block')
      
      // Check if content has file data
      if (typeof block.content === 'string') {
        try {
          const parsed = JSON.parse(block.content)
          if (parsed.file_id) {
            console.log('[extractFileIds] Found file_id in parsed tool_result:', parsed.file_id)
            fileIds.push(parsed.file_id)
          }
        } catch {}
      }
      
      // Check if content is an array with files
      if (Array.isArray(block.content)) {
        for (const item of block.content) {
          if (item.type === 'file' && item.file_id) {
            console.log('[extractFileIds] Found file in tool_result array:', item.file_id)
            fileIds.push(item.file_id)
          }
          if (item.file_id) {
            console.log('[extractFileIds] Found file_id in tool_result item:', item.file_id)
            fileIds.push(item.file_id)
          }
        }
      }
    }

    // Check for bash_code_execution_tool_result
    if (block.type === 'bash_code_execution_tool_result') {
      console.log('[extractFileIds] Found bash_code_execution_tool_result')
      const content = block.content
      if (content?.type === 'bash_code_execution_result' && Array.isArray(content.content)) {
        for (const item of content.content) {
          if (item.file_id) {
            console.log('[extractFileIds] Found file_id in bash result:', item.file_id)
            fileIds.push(item.file_id)
          }
        }
      }
    }

    // Check for tool_use blocks (Skills)
    if (block.type === 'tool_use') {
      console.log('[extractFileIds] Found tool_use block')
      if (block.content) {
        if (Array.isArray(block.content)) {
          for (const item of block.content) {
            if (item.file_id) {
              console.log('[extractFileIds] Found file_id in tool_use array:', item.file_id)
              fileIds.push(item.file_id)
            }
          }
        }
      }
    }

    // Check if block itself has file_id
    if (block.file_id) {
      console.log('[extractFileIds] Found file_id directly on block:', block.file_id)
      fileIds.push(block.file_id)
    }

    // Check for any nested content with file_id
    if (block.content && typeof block.content === 'object' && block.content.file_id) {
      console.log('[extractFileIds] Found file_id in block.content:', block.content.file_id)
      fileIds.push(block.content.file_id)
    }
  }

  console.log('[extractFileIds] Final file IDs:', fileIds)
  return fileIds
}
