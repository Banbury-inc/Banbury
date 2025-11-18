// Helper functions to check file types
export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'];
  return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const isPdfFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.pdf');
};

export const isDocumentFile = (fileName: string): boolean => {
  const documentExtensions = ['.doc', '.docx', '.txt', '.rtf', '.odt'];
  return documentExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const isSpreadsheetFile = (fileName: string): boolean => {
  const spreadsheetExtensions = ['.xls', '.xlsx', '.csv', '.ods'];
  return spreadsheetExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const isVideoFile = (fileName: string): boolean => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'];
  return videoExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const isCodeFile = (fileName: string): boolean => {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt',
    '.html', '.css', '.scss', '.sass', '.less', '.json', '.xml', '.yaml', '.yml', '.md', '.sql', '.sh', '.bash',
    '.vue', '.svelte', '.r', '.m', '.pl', '.lua', '.dart', '.elm', '.clj', '.hs', '.fs', '.vb', '.asm', '.s',
    '.coffee', '.litcoffee', '.iced', '.pug', '.jade', '.haml', '.slim', '.erb', '.ejs', '.hbs', '.mustache',
    '.twig', '.smarty', '.tpl', '.ctp', '.blade.php', '.vue', '.svelte', '.r', '.m', '.pl', '.lua', '.dart',
    '.elm', '.clj', '.hs', '.fs', '.vb', '.asm', '.s', '.coffee', '.litcoffee', '.iced', '.pug', '.jade',
    '.haml', '.slim', '.erb', '.ejs', '.hbs', '.mustache', '.twig', '.smarty', '.tpl', '.ctp', '.blade.php'
  ];
  return codeExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const isBrowserFile = (fileName: string): boolean => {
  const browserExtensions = ['.html', '.htm', '.xhtml', '.shtml', '.shtm'];
  return browserExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
};

export const isNotebookFile = (fileName: string): boolean => {
  return fileName.toLowerCase().endsWith('.ipynb');
};

export const isDrawioFile = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return extension === '.drawio' || (extension === '.xml' && fileName.toLowerCase().includes('drawio'));
};

export const isTldrawFile = (fileName: string): boolean => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
  return extension === '.tldraw' || extension === '.tldr' || (extension === '.json' && fileName.toLowerCase().includes('tldraw'));
};

export const isViewableFile = (fileName: string): boolean => {
  return isImageFile(fileName) || 
         isPdfFile(fileName) || 
         isDocumentFile(fileName) || 
         isSpreadsheetFile(fileName) || 
         isVideoFile(fileName) || 
         isCodeFile(fileName) || 
         isBrowserFile(fileName) ||
         isNotebookFile(fileName) ||
         isDrawioFile(fileName) ||
         isTldrawFile(fileName);
};

// Google Drive file type detection based on mimeType
export const isDriveImageFile = (mimeType?: string): boolean => {
  if (!mimeType) return false
  return mimeType.includes('image/')
}

export const isDrivePdfFile = (mimeType?: string): boolean => {
  if (!mimeType) return false
  return mimeType.includes('pdf')
}

export const isDriveDocumentFile = (mimeType?: string): boolean => {
  if (!mimeType) return false
  // Exclude Google Docs - they should use GoogleDriveViewer
  if (mimeType.includes('vnd.google-apps')) return false
  // Only match downloadable document formats
  return mimeType.includes('msword') || 
         mimeType.includes('wordprocessingml') ||
         mimeType.includes('text/plain') ||
         mimeType.includes('text/rtf')
}

export const isDriveSpreadsheetFile = (mimeType?: string): boolean => {
  if (!mimeType) return false
  // Exclude Google Sheets - they should use GoogleDriveViewer
  if (mimeType.includes('vnd.google-apps')) return false
  // Only match downloadable spreadsheet formats
  return mimeType.includes('excel') || 
         mimeType.includes('ms-excel') ||
         mimeType.includes('csv') ||
         mimeType.includes('application/vnd.openxmlformats-officedocument.spreadsheetml')
}

export const isDriveVideoFile = (mimeType?: string): boolean => {
  if (!mimeType) return false
  return mimeType.includes('video/')
}

export const isDriveCodeFile = (mimeType?: string, fileName?: string): boolean => {
  if (!mimeType && !fileName) return false
  // Check by mimeType
  if (mimeType?.includes('text/') || 
      mimeType?.includes('application/json') || 
      mimeType?.includes('application/xml') ||
      mimeType?.includes('application/javascript')) {
    return true
  }
  // Check by filename if available
  if (fileName) {
    return isCodeFile(fileName)
  }
  return false
}

// Check if file type from Drive can be viewed
export const isDriveFileViewable = (mimeType?: string, fileName?: string): boolean => {
  if (!mimeType && !fileName) return false
  // Google Workspace files are always viewable
  if (mimeType?.includes('vnd.google-apps')) return true
  // Other Drive files
  return isDriveImageFile(mimeType) ||
         isDrivePdfFile(mimeType) ||
         isDriveDocumentFile(mimeType) ||
         isDriveSpreadsheetFile(mimeType) ||
         isDriveVideoFile(mimeType) ||
         isDriveCodeFile(mimeType, fileName)
}

// Extended isViewableFile that handles both local and Drive files
export const isViewableFileExtended = (file: { name: string; path?: string; mimeType?: string }): boolean => {
  // Check if it's a Drive file
  const isDriveFile = file.path?.startsWith('drive://')
  
  if (isDriveFile) {
    // Use Drive-specific detection
    return isDriveFileViewable(file.mimeType, file.name)
  }
  
  // Use local file detection
  return isViewableFile(file.name)
}
