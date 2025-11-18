import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Editor } from '@monaco-editor/react';
import { FileSystemItem } from '../../../utils/fileTreeUtils';
import { ApiService } from '../../../../backend/api/apiService';
import { CONFIG } from '../../../config/config';
import IDESettings from './IDESettings';
import { 
  File, 
  Folder, 
  Save, 
  Play, 
  Settings, 
  Search, 
  Terminal, 
  GitBranch, 
  Eye,
  Edit3,
  Download,
  Upload,
  Trash2,
  Plus,
  ChevronDown,
  ChevronRight,
  FileText,
  FileCode,
  FileImage,
  FileVideo,
  FileAudio,
  FileSpreadsheet,
  FileArchive,
  FileJson,
  FileType,
  FileBarChart,
  FileCog
} from 'lucide-react';

interface IDEProps {
  file: FileSystemItem;
  userInfo?: {
    username: string;
    email?: string;
  } | null;
  onSaveComplete?: () => void;
}

interface FileTab {
  id: string;
  file: FileSystemItem;
  content: string;
  isModified: boolean;
  isActive: boolean;
}

interface FileExplorerItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  path: string;
  children?: FileExplorerItem[];
  isExpanded?: boolean;
}

const IDE: React.FC<IDEProps> = ({ file, userInfo, onSaveComplete }) => {
  const [tabs, setTabs] = useState<FileTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [fileExplorer, setFileExplorer] = useState<FileExplorerItem[]>([]);
  const [isFileExplorerOpen, setIsFileExplorerOpen] = useState(true);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentFile, setCurrentFile] = useState<FileSystemItem>(file);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('plaintext');
  const [theme, setTheme] = useState<'vs-dark' | 'vs-light'>('vs-dark');
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState<'on' | 'off'>('on');
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [terminalOutput, setTerminalOutput] = useState<string[]>([]);
  const [terminalInput, setTerminalInput] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const editorRef = useRef<any>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

  // Map file extensions to Monaco Editor language IDs
  const getLanguageFromExtension = (fileName: string): string => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    const languageMap: { [key: string]: string } = {
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.py': 'python',
      '.java': 'java',
      '.cpp': 'cpp',
      '.c': 'c',
      '.h': 'c',
      '.hpp': 'cpp',
      '.cs': 'csharp',
      '.php': 'php',
      '.rb': 'ruby',
      '.go': 'go',
      '.rs': 'rust',
      '.swift': 'swift',
      '.kt': 'kotlin',
      '.scala': 'scala',
      '.html': 'html',
      '.htm': 'html',
      '.css': 'css',
      '.scss': 'scss',
      '.sass': 'sass',
      '.less': 'less',
      '.xml': 'xml',
      '.json': 'json',
      '.yaml': 'yaml',
      '.yml': 'yaml',
      '.toml': 'toml',
      '.ini': 'ini',
      '.cfg': 'ini',
      '.conf': 'ini',
      '.sh': 'shell',
      '.bash': 'shell',
      '.zsh': 'shell',
      '.fish': 'shell',
      '.sql': 'sql',
      '.r': 'r',
      '.m': 'matlab',
      '.mat': 'matlab',
      '.ipynb': 'json',
      '.jl': 'julia',
      '.dart': 'dart',
      '.lua': 'lua',
      '.pl': 'perl',
      '.pm': 'perl',
      '.tcl': 'tcl',
      '.vbs': 'vb',
      '.ps1': 'powershell',
      '.bat': 'batch',
      '.cmd': 'batch',
      '.coffee': 'coffeescript',
      '.litcoffee': 'coffeescript',
      '.iced': 'coffeescript',
      '.md': 'markdown',
      '.markdown': 'markdown',
      '.tex': 'latex',
      '.rtex': 'latex',
      '.bib': 'bibtex',
      '.vue': 'vue',
      '.svelte': 'svelte',
    };

    return languageMap[extension] || 'plaintext';
  };

  // Get file icon based on type
  const getFileIcon = (fileName: string) => {
    const extension = fileName.toLowerCase().substring(fileName.lastIndexOf('.'));
    
    if (['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.scala'].includes(extension)) {
      return FileCode;
    } else if (['.html', '.htm', '.css', '.scss', '.sass', '.less'].includes(extension)) {
      return FileText;
    } else if (['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg'].includes(extension)) {
      return FileImage;
    } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv'].includes(extension)) {
      return FileVideo;
    } else if (['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma'].includes(extension)) {
      return FileAudio;
    } else if (['.xlsx', '.xls', '.csv'].includes(extension)) {
      return FileSpreadsheet;
    } else if (['.zip', '.rar', '.7z', '.tar', '.gz'].includes(extension)) {
      return FileArchive;
    } else if (['.json', '.xml', '.yaml', '.yml'].includes(extension)) {
      return FileJson;
    } else if (['.ttf', '.otf', '.woff', '.woff2'].includes(extension)) {
      return FileType;
    } else if (['.pptx', '.ppt'].includes(extension)) {
      return FileBarChart;
    } else if (['.exe', '.msi', '.app', '.dmg'].includes(extension)) {
      return FileCog;
    }
    
    return File;
  };

  // Load file content
  const loadFileContent = useCallback(async (fileItem: FileSystemItem) => {

    try {
      setLoading(true);
      setError(null);

      const downloadResult = await ApiService.downloadS3File(fileItem.file_id || '', fileItem.name);
      
      if (!downloadResult.success) {
        throw new Error('Failed to download file');
      }

      const fileContent = await downloadResult.blob.text();
      const detectedLanguage = getLanguageFromExtension(fileItem.name);
      
      setLanguage(detectedLanguage);
      setCurrentFile(fileItem);
      
      // Add to tabs if not already present
      setTabs(prevTabs => {
        const existingTab = prevTabs.find(tab => tab.file.file_id === fileItem.file_id);
        if (existingTab) {
          // Update existing tab
          return prevTabs.map(tab => 
            tab.file.file_id === fileItem.file_id 
              ? { ...tab, content: fileContent, isActive: true }
              : { ...tab, isActive: false }
          );
        } else {
          // Add new tab
          const newTab: FileTab = {
            id: fileItem.file_id,
            file: fileItem,
            content: fileContent,
            isModified: false,
            isActive: true
          };
          return prevTabs.map(tab => ({ ...tab, isActive: false })).concat(newTab);
        }
      });
      
      setActiveTabId(fileItem.file_id);
    } catch (err) {
      console.error('Error loading file content:', err);
      setError(err instanceof Error ? err.message : 'Failed to load file content');
    } finally {
      setLoading(false);
    }
  }, [userInfo]);

  // Save file content
  const saveFile = useCallback(async (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || !tab.isModified) return;

    try {
      // Get current editor content
      const currentContent = editorRef.current?.getValue() || tab.content;
      
      // Create blob from content
      const blob = new Blob([currentContent], { type: 'text/plain' });
      
      // Upload to S3
      await ApiService.uploadToS3(
        blob,
        tab.file.name,
        userInfo?.username || 'web-editor' || '',
        tab.file.path,
        'uploads'
      );

      // Update tab
      setTabs(prevTabs => 
        prevTabs.map(t => 
          t.id === tabId 
            ? { ...t, content: currentContent, isModified: false }
            : t
        )
      );

      onSaveComplete?.();
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save file');
    }
  }, [tabs, userInfo, onSaveComplete]);

  // Handle editor change
  const handleEditorChange = useCallback((value: string | undefined, event: any) => {
    if (!activeTabId) return;
    
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId 
          ? { ...tab, content: value || '', isModified: true }
          : tab
      )
    );
  }, [activeTabId]);

  // Handle tab close
  const closeTab = useCallback((tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (tab?.isModified) {
      if (!window.confirm('File has unsaved changes. Close anyway?')) {
        return;
      }
    }

    setTabs(prevTabs => {
      const newTabs = prevTabs.filter(t => t.id !== tabId);
      if (newTabs.length > 0 && activeTabId === tabId) {
        setActiveTabId(newTabs[newTabs.length - 1].id);
      }
      return newTabs;
    });
  }, [tabs, activeTabId]);

  // Handle terminal input
  const handleTerminalInput = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const command = terminalInput.trim();
      if (command) {
        setTerminalOutput(prev => [...prev, `$ ${command}`, 'Command executed (simulated)']);
        setTerminalInput('');
      }
    }
  }, [terminalInput]);

  // Load initial file
  useEffect(() => {
    loadFileContent(file);
  }, [file, loadFileContent]);

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeTabId) {
        const tab = tabs.find(t => t.id === activeTabId);
        if (tab?.isModified) {
          saveFile(activeTabId);
        }
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, [activeTabId, tabs, saveFile]);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Loading IDE...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-800">
        <div className="text-center max-w-md">
          <h3 className="text-xl font-semibold text-white mb-2">Error Loading IDE</h3>
          <p className="text-gray-400 mb-4">{error}</p>
        </div>
      </div>
    );
  }

  const activeTab = tabs.find(t => t.id === activeTabId);

  return (
    <div className="h-full bg-zinc-800 flex flex-col">
      {/* IDE Header */}
      <div className="bg-zinc-800 border-b border-zinc-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsFileExplorerOpen(!isFileExplorerOpen)}
            className="text-gray-400 hover:text-white"
          >
            {isFileExplorerOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
          <span className="text-sm text-gray-300 font-medium">IDE</span>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            className="text-gray-400 hover:text-white p-1"
            title="Search"
          >
            <Search size={16} />
          </button>
          <button
            onClick={() => setIsTerminalOpen(!isTerminalOpen)}
            className="text-gray-400 hover:text-white p-1"
            title="Terminal"
          >
            <Terminal size={16} />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="text-gray-400 hover:text-white p-1"
            title="Settings"
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Main IDE Content */}
      <div className="flex-1 flex">
        {/* File Explorer Sidebar */}
        {isFileExplorerOpen && (
          <div className="w-64 bg-zinc-800 border-r  border-zinc-600 flex flex-col">
            <div className="p-3 border-b border-zinc-600">
              <h3 className="text-sm font-medium text-gray-300">Explorer</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2">
              {/* File tree would go here */}
              <div className="text-sm text-gray-400">File explorer coming soon...</div>
            </div>
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 flex flex-col">
          {/* Tab Bar */}
          {tabs.length > 0 && (
            <div className="bg-zinc-800 border-b border-zinc-600 flex items-center">
              {tabs.map(tab => {
                const FileIcon = getFileIcon(tab.file.name);
                return (
                  <div
                    key={tab.id}
                    className={`flex items-center gap-2 px-3 py-2 text-sm cursor-pointer border-r border-zinc-700 ${
                      tab.isActive ? 'bg-zinc-700 text-white' : 'text-gray-400 hover:text-gray-300'
                    }`}
                    onClick={() => setActiveTabId(tab.id)}
                  >
                    <FileIcon size={14} />
                    <span className="truncate max-w-32">{tab.file.name}</span>
                    {tab.isModified && <span className="text-yellow-400">•</span>}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        closeTab(tab.id);
                      }}
                      className="ml-2 text-gray-500 hover:text-red-400"
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Editor */}
          <div className="flex-1 relative">
            {activeTab ? (
              <Editor
                height="100%"
                defaultLanguage={getLanguageFromExtension(activeTab.file.name)}
                value={activeTab.content}
                theme={theme}
                onChange={handleEditorChange}
                onMount={(editor) => {
                  editorRef.current = editor;
                }}
                options={{
                  readOnly: false,
                  minimap: { enabled: showMinimap },
                  fontSize: fontSize,
                  lineNumbers: showLineNumbers ? 'on' : 'off',
                  wordWrap: wordWrap,
                  automaticLayout: true,
                  bracketPairColorization: { enabled: true },
                  folding: true,
                  renderWhitespace: 'selection',
                  renderControlCharacters: false,
                  renderIndentGuides: true,
                  highlightActiveIndentGuide: true,
                  guides: {
                    bracketPairs: true,
                    indentation: true,
                  },
                }}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                No file open
              </div>
            )}
          </div>

          {/* Terminal */}
          {isTerminalOpen && (
            <div className="h-48 bg-zinc-700 border-t border-zinc-700 flex flex-col">
              <div className="px-3 py-2 border-b border-zinc-700 flex items-center justify-between">
                <span className="text-sm text-gray-300">Terminal</span>
                <button
                  onClick={() => setIsTerminalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  ×
                </button>
              </div>
              <div className="flex-1 p-3 overflow-y-auto" ref={terminalRef}>
                {terminalOutput.map((line, index) => (
                  <div key={index} className="text-sm text-gray-300 font-mono">
                    {line}
                  </div>
                ))}
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>
                  <input
                    type="text"
                    value={terminalInput}
                    onChange={(e) => setTerminalInput(e.target.value)}
                    onKeyDown={handleTerminalInput}
                    className="flex-1 bg-transparent text-gray-300 outline-none font-mono"
                    placeholder="Enter command..."
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-zinc-800 border-t border-zinc-700 px-4 py-1 flex items-center justify-between text-xs text-gray-400">
        <div className="flex items-center gap-4">
          <span>{activeTab ? `${language} • ${activeTab.file.name}` : 'No file'}</span>
          {activeTab?.isModified && <span className="text-yellow-400">Modified</span>}
        </div>
        <div className="flex items-center gap-4">
          <span>Ln {editorRef.current?.getPosition()?.lineNumber || 1}</span>
          <span>Col {editorRef.current?.getPosition()?.column || 1}</span>
          <span>{fontSize}px</span>
        </div>
      </div>

      {/* Settings Panel */}
      <IDESettings
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        fontSize={fontSize}
        onFontSizeChange={setFontSize}
        wordWrap={wordWrap}
        onWordWrapChange={setWordWrap}
        showLineNumbers={showLineNumbers}
        onShowLineNumbersChange={setShowLineNumbers}
        showMinimap={showMinimap}
        onShowMinimapChange={setShowMinimap}
      />
    </div>
  );
};

export default IDE;
