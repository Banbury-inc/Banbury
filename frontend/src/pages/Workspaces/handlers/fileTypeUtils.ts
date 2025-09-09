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
