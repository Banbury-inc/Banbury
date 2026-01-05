import { 
  File, 
  FileText,
  FileImage,
  FileVideo,
  FileAudio,
  FileCode,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  FileType,
  FileBarChart,
  FileCog,
  Network,
} from 'lucide-react'

// File type detection functions
export const getFileExtension = (fileName: string): string => {
  const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'))
  return extension
}

export const isImageFile = (fileName: string): boolean => {
  const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg', '.tiff', '.tif', '.ico']
  const extension = getFileExtension(fileName)
  return imageExtensions.includes(extension)
}

export const isVideoFile = (fileName: string): boolean => {
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv', '.m4v', '.3gp', '.ogv']
  const extension = getFileExtension(fileName)
  return videoExtensions.includes(extension)
}

export const isAudioFile = (fileName: string): boolean => {
  const audioExtensions = ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus', '.aiff', '.au']
  const extension = getFileExtension(fileName)
  return audioExtensions.includes(extension)
}

export const isPdfFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.pdf'
}

export const isDocumentFile = (fileName: string): boolean => {
  const documentExtensions = ['.docx', '.doc', '.rtf', '.odt', '.txt', '.md', '.markdown']
  const extension = getFileExtension(fileName)
  return documentExtensions.includes(extension)
}

export const isSpreadsheetFile = (fileName: string): boolean => {
  const spreadsheetExtensions = ['.xlsx', '.xls', '.csv', '.ods', '.tsv']
  const extension = getFileExtension(fileName)
  return spreadsheetExtensions.includes(extension)
}

export const isPresentationFile = (fileName: string): boolean => {
  const presentationExtensions = ['.pptx', '.ppt', '.odp']
  const extension = getFileExtension(fileName)
  return presentationExtensions.includes(extension)
}

export const isCodeFile = (fileName: string): boolean => {
  const codeExtensions = [
    '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.h', '.hpp', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala',
    '.html', '.htm', '.css', '.scss', '.sass', '.less', '.xml', '.json', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.sh', '.bash', '.zsh', '.fish',
    '.sql', '.r', '.m', '.mat', '.ipynb', '.jl', '.dart', '.lua', '.pl', '.pm', '.tcl', '.vbs', '.ps1', '.bat', '.cmd', '.coffee', '.litcoffee', '.iced'
  ]
  const extension = getFileExtension(fileName)
  return codeExtensions.includes(extension)
}

export const isArchiveFile = (fileName: string): boolean => {
  const archiveExtensions = ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.lzma', '.cab', '.iso', '.dmg', '.pkg']
  const extension = getFileExtension(fileName)
  return archiveExtensions.includes(extension)
}

export const isDataFile = (fileName: string): boolean => {
  const dataExtensions = ['.json', '.xml', '.csv', '.tsv', '.yaml', '.yml', '.toml', '.ini', '.cfg', '.conf', '.log', '.sql', '.db', '.sqlite', '.sqlite3']
  const extension = getFileExtension(fileName)
  return dataExtensions.includes(extension)
}

export const isDrawioFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.drawio' || (extension === '.xml' && fileName.toLowerCase().includes('drawio'))
}

export const isTldrawFile = (fileName: string): boolean => {
  const extension = getFileExtension(fileName)
  return extension === '.tldraw' || extension === '.tldr' || (extension === '.json' && fileName.toLowerCase().includes('tldraw'))
}

export const isExecutableFile = (fileName: string): boolean => {
  const executableExtensions = ['.exe', '.msi', '.app', '.dmg', '.deb', '.rpm', '.pkg', '.sh', '.bat', '.cmd', '.ps1', '.vbs', '.jar', '.war', '.ear']
  const extension = getFileExtension(fileName)
  return executableExtensions.includes(extension)
}

export const isFontFile = (fileName: string): boolean => {
  const fontExtensions = ['.ttf', '.otf', '.woff', '.woff2', '.eot', '.svg']
  const extension = getFileExtension(fileName)
  return fontExtensions.includes(extension)
}

export const is3DFile = (fileName: string): boolean => {
  const threeDExtensions = ['.obj', '.fbx', '.dae', '.3ds', '.blend', '.max', '.ma', '.mb', '.c4d', '.stl', '.ply', '.wrl', '.x3d']
  const extension = getFileExtension(fileName)
  return threeDExtensions.includes(extension)
}

export const isVectorFile = (fileName: string): boolean => {
  const vectorExtensions = ['.svg', '.ai', '.eps', '.pdf', '.cdr', '.wmf', '.emf', '.dxf', '.dwg']
  const extension = getFileExtension(fileName)
  return vectorExtensions.includes(extension)
}

// Function to get the appropriate icon component and color for a file type
export function getFileIcon(fileName: string): { icon: typeof File, color: string } {
  if (isTldrawFile(fileName)) return { icon: Network, color: 'text-purple-400' }
  if (isDrawioFile(fileName)) return { icon: Network, color: 'text-blue-400' }
  if (isImageFile(fileName)) return { icon: FileImage, color: 'text-green-400' }
  if (isVideoFile(fileName)) return { icon: FileVideo, color: 'text-red-400' }
  if (isAudioFile(fileName)) return { icon: FileAudio, color: 'text-blue-400' }
  if (isPdfFile(fileName)) return { icon: FileText, color: 'text-red-400' }
  if (isDocumentFile(fileName)) return { icon: FileText, color: 'text-blue-500' }
  if (isSpreadsheetFile(fileName)) return { icon: FileSpreadsheet, color: 'text-green-500' }
  if (isPresentationFile(fileName)) return { icon: FileBarChart, color: 'text-orange-400' }
  if (isCodeFile(fileName)) return { icon: FileCode, color: 'text-yellow-400' }
  if (isArchiveFile(fileName)) return { icon: FileArchive, color: 'text-gray-400' }
  if (isDataFile(fileName)) return { icon: FileJson, color: 'text-indigo-400' }
  if (isExecutableFile(fileName)) return { icon: FileCog, color: 'text-red-500' }
  if (isFontFile(fileName)) return { icon: FileType, color: 'text-pink-400' }
  if (is3DFile(fileName)) return { icon: FileCog, color: 'text-cyan-400' }
  if (isVectorFile(fileName)) return { icon: FileImage, color: 'text-emerald-400' }
  
  // Default file icon
  return { icon: File, color: 'text-gray-400' }
}
