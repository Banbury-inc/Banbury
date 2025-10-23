// Simple DOCX text extraction function
export function extractTextFromDocx(buffer: Buffer, fileName: string): string {
  try {
    const content = buffer.toString('binary');
    const xmlMatches = content.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
    
    if (xmlMatches) {
      const extractedText = xmlMatches
        .map(match => {
          const textMatch = match.match(/<w:t[^>]*>(.*?)<\/w:t>/);
          return textMatch ? textMatch[1] : '';
        })
        .filter(text => text.trim().length > 0)
        .join(' ');
      
      if (extractedText.trim().length > 0) {
        return `Document: ${fileName}\n\nExtracted Content:\n${extractedText}`;
      }
    }
    
    const simpleText = content.replace(/[^\x20-\x7E]/g, ' ').replace(/\s+/g, ' ').trim();
    const meaningfulText = simpleText.length > 100 ? simpleText.substring(0, 2000) : '';
    
    if (meaningfulText) {
      return `Document: ${fileName}\n\nPartial Content:\n${meaningfulText}`;
    }
    
    return `Document: ${fileName}\n\nThis DOCX file was attached but text extraction was not successful. The document contains ${buffer.length} bytes of data. Please ask the user to provide the key content or specific information from this document.`;
    
  } catch (error) {
    return `Document: ${fileName}\n\nThis DOCX file could not be processed for text extraction. Please ask the user to provide the text content or key information from this document.`;
  }
}

