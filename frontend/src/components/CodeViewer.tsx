import React, { useState, useEffect } from 'react';
import { FileSystemItem } from '../utils/fileTreeUtils';
import { ApiService } from '../services/apiService';
import { CONFIG } from '../config/config';

interface CodeViewerProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
}

const CodeViewer: React.FC<CodeViewerProps> = ({ file, userInfo }) => {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('plaintext');

  // Map file extensions to language names for display
  const getLanguageFromExtension = (fileName: string): string => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    const languageMap: { [key: string]: string } = {
      '.js': 'JavaScript',
      '.jsx': 'JavaScript',
      '.ts': 'TypeScript',
      '.tsx': 'TypeScript',
      '.py': 'Python',
      '.java': 'Java',
      '.cpp': 'C++',
      '.c': 'C',
      '.h': 'C',
      '.hpp': 'C++',
      '.cs': 'C#',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.rs': 'Rust',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala',
      '.html': 'HTML',
      '.htm': 'HTML',
      '.css': 'CSS',
      '.scss': 'SCSS',
      '.sass': 'Sass',
      '.less': 'Less',
      '.xml': 'XML',
      '.json': 'JSON',
      '.yaml': 'YAML',
      '.yml': 'YAML',
      '.toml': 'TOML',
      '.ini': 'INI',
      '.cfg': 'INI',
      '.conf': 'INI',
      '.sh': 'Shell',
      '.bash': 'Bash',
      '.zsh': 'Zsh',
      '.fish': 'Fish',
      '.sql': 'SQL',
      '.r': 'R',
      '.m': 'MATLAB',
      '.mat': 'MATLAB',
      '.ipynb': 'Jupyter Notebook',
      '.jl': 'Julia',
      '.dart': 'Dart',
      '.lua': 'Lua',
      '.pl': 'Perl',
      '.pm': 'Perl',
      '.tcl': 'TCL',
      '.vbs': 'VBScript',
      '.ps1': 'PowerShell',
      '.bat': 'Batch',
      '.cmd': 'Batch',
      '.coffee': 'CoffeeScript',
      '.litcoffee': 'CoffeeScript',
      '.iced': 'CoffeeScript',
      '.md': 'Markdown',
      '.markdown': 'Markdown',
      '.tex': 'LaTeX',
      '.rtex': 'LaTeX',
      '.bib': 'BibTeX',
      '.vue': 'Vue',
      '.svelte': 'Svelte',
    };

    return languageMap[extension] || 'Plain Text';
  };

  useEffect(() => {
    const fetchFileContent = async () => {
      if (!file.file_id || !userInfo?.username) {
        setError('File or user information not available');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Get the file content from S3 using the ApiService
        const downloadResult = await ApiService.downloadS3File(file.file_id, file.name);
        
        if (!downloadResult.success) {
          throw new Error('Failed to download file');
        }

        // Convert blob to text
        const fileContent = await downloadResult.blob.text();
        setContent(fileContent);
        
        // Set the language based on file extension
        const detectedLanguage = getLanguageFromExtension(file.name);
        setLanguage(detectedLanguage);
      } catch (err) {
        console.error('Error fetching file content:', err);
        setError(err instanceof Error ? err.message : 'Failed to load file content');
      } finally {
        setLoading(false);
      }
    };

    fetchFileContent();
  }, [file, userInfo]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading code file...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-black">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading File</h3>
          <p className="text-gray-400 mb-4">{error}</p>
          <p className="text-gray-500 text-sm">
            File: {file.name}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-black flex flex-col">
      {/* Header with file info */}
      <div className="bg-zinc-900 border-b border-zinc-700 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-sm text-gray-300">
            <span className="font-medium">{file.name}</span>
            <span className="text-gray-500 ml-2">({language})</span>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          {file.size && `${(file.size / 1024).toFixed(1)} KB`}
        </div>
      </div>

      {/* Code Content */}
      <div className="flex-1 min-h-0 p-4">
        <pre className="bg-zinc-800 text-gray-300 text-sm p-4 rounded-lg overflow-auto h-full font-mono whitespace-pre-wrap">
          {content}
        </pre>
      </div>
    </div>
  );
};

export default CodeViewer;
