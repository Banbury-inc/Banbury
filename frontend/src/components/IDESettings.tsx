import React from 'react';
import { X, Settings, Monitor, Type, Eye, EyeOff } from 'lucide-react';

interface IDESettingsProps {
  isOpen: boolean;
  onClose: () => void;
  theme: 'vs-dark' | 'vs-light';
  onThemeChange: (theme: 'vs-dark' | 'vs-light') => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  wordWrap: 'on' | 'off';
  onWordWrapChange: (wrap: 'on' | 'off') => void;
  showLineNumbers: boolean;
  onShowLineNumbersChange: (show: boolean) => void;
  showMinimap: boolean;
  onShowMinimapChange: (show: boolean) => void;
}

const IDESettings: React.FC<IDESettingsProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  fontSize,
  onFontSizeChange,
  wordWrap,
  onWordWrapChange,
  showLineNumbers,
  onShowLineNumbersChange,
  showMinimap,
  onShowMinimapChange,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-zinc-900 border border-zinc-700 rounded-lg w-96 max-h-[80vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div className="flex items-center gap-2">
            <Settings size={20} className="text-gray-300" />
            <h2 className="text-lg font-semibold text-white">IDE Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Content */}
        <div className="p-4 space-y-6">
          {/* Theme Setting */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Monitor size={16} />
              Theme
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onThemeChange('vs-dark')}
                className={`px-3 py-2 rounded text-sm ${
                  theme === 'vs-dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => onThemeChange('vs-light')}
                className={`px-3 py-2 rounded text-sm ${
                  theme === 'vs-light'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Light
              </button>
            </div>
          </div>

          {/* Font Size Setting */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              <Type size={16} />
              Font Size
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="10"
                max="24"
                value={fontSize}
                onChange={(e) => onFontSizeChange(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-300 w-8">{fontSize}px</span>
            </div>
          </div>

          {/* Word Wrap Setting */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              Word Wrap
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onWordWrapChange('on')}
                className={`px-3 py-2 rounded text-sm ${
                  wordWrap === 'on'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                On
              </button>
              <button
                onClick={() => onWordWrapChange('off')}
                className={`px-3 py-2 rounded text-sm ${
                  wordWrap === 'off'
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Off
              </button>
            </div>
          </div>

          {/* Line Numbers Setting */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              {showLineNumbers ? <Eye size={16} /> : <EyeOff size={16} />}
              Line Numbers
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onShowLineNumbersChange(true)}
                className={`px-3 py-2 rounded text-sm ${
                  showLineNumbers
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Show
              </button>
              <button
                onClick={() => onShowLineNumbersChange(false)}
                className={`px-3 py-2 rounded text-sm ${
                  !showLineNumbers
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Hide
              </button>
            </div>
          </div>

          {/* Minimap Setting */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3">
              {showMinimap ? <Eye size={16} /> : <EyeOff size={16} />}
              Minimap
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => onShowMinimapChange(true)}
                className={`px-3 py-2 rounded text-sm ${
                  showMinimap
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Show
              </button>
              <button
                onClick={() => onShowMinimapChange(false)}
                className={`px-3 py-2 rounded text-sm ${
                  !showMinimap
                    ? 'bg-blue-600 text-white'
                    : 'bg-zinc-700 text-gray-300 hover:bg-zinc-600'
                }`}
              >
                Hide
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-700 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-zinc-700 text-white rounded hover:bg-zinc-600"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default IDESettings;
