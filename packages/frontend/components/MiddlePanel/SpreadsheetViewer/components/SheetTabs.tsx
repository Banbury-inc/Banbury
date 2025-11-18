import React from 'react';
import { Plus, X, Menu, ChevronDown } from 'lucide-react';
import { Button } from '../../../ui/button';
import { Typography } from '../../../ui/typography';

interface SheetTab {
  name: string;
  index: number;
}

interface SheetTabsProps {
  sheets: SheetTab[];
  activeIndex: number;
  onTabChange: (index: number) => void;
  onAddSheet?: () => void;
  onRenameSheet?: (index: number, newName: string) => void;
  onDeleteSheet?: (index: number) => void;
  onDuplicateSheet?: (index: number) => void;
}

export function SheetTabs({
  sheets,
  activeIndex,
  onTabChange,
  onAddSheet,
  onRenameSheet,
  onDeleteSheet,
  onDuplicateSheet
}: SheetTabsProps) {
  const [editingIndex, setEditingIndex] = React.useState<number | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [dropdownOpen, setDropdownOpen] = React.useState<number | null>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState<{ left: number; bottom: number } | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(null);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDoubleClick = (index: number, currentName: string) => {
    if (onRenameSheet) {
      setEditingIndex(index);
      setEditingName(currentName);
      setTimeout(() => inputRef.current?.select(), 0);
    }
  };

  const handleRename = (index: number) => {
    if (editingName.trim() && onRenameSheet) {
      onRenameSheet(index, editingName.trim());
    }
    setEditingIndex(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    if (e.key === 'Enter') {
      handleRename(index);
    } else if (e.key === 'Escape') {
      setEditingIndex(null);
    }
  };

  return (
    <div 
      className="flex items-center gap-0 bg-[#f9fafb] border-t border-gray-300 overflow-x-auto flex-shrink-0" 
      style={{ 
        minHeight: '36px', 
        maxHeight: '36px',
        width: '100%',
        position: 'relative',
        zIndex: 100
      }}
    >
      {/* Add sheet button */}
      {onAddSheet && (
        <button
          onClick={onAddSheet}
          className="p-2 hover:bg-gray-200 transition-colors"
          title="Add sheet"
          style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Plus className="h-4 w-4 text-gray-700" strokeWidth={1} />
        </button>
      )}
      
      {/* Menu button */}
      <button
        className="p-2 hover:bg-gray-200 transition-colors"
        title="All sheets"
        style={{ height: '36px', width: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <Menu className="h-4 w-4 text-gray-700" strokeWidth={1} />
      </button>
      
      {/* Sheet tabs */}
      <div className="flex items-center gap-1 pl-2">
        {sheets.map((sheet, index) => (
          <div
            key={index}
            className={`
              flex items-center gap-1 px-3 py-1 cursor-pointer
              transition-colors duration-150 border-b-2
              ${activeIndex === index
                ? 'text-gray-900 font-medium border-blue-600 bg-white'
                : 'text-gray-600 border-transparent hover:bg-gray-200'
              }
            `}
            onClick={() => onTabChange(index)}
            onDoubleClick={() => handleDoubleClick(index, sheet.name)}
            style={{ height: '36px' }}
          >
            {editingIndex === index ? (
              <input
                ref={inputRef}
                type="text"
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onBlur={() => handleRename(index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="bg-white text-gray-900 px-1 py-0 text-sm border border-blue-500 outline-none rounded w-24"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <>
                <span className="text-sm">
                  {sheet.name}
                </span>
                {activeIndex === index && (
                  <div className="relative">
                    <button
                      ref={buttonRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (dropdownOpen === index) {
                          setDropdownOpen(null);
                        } else {
                          // Calculate position relative to button
                          const rect = buttonRef.current?.getBoundingClientRect();
                          if (rect) {
                            setDropdownPosition({
                              left: rect.left,
                              bottom: window.innerHeight - rect.top + 4 // 4px gap above button
                            });
                          }
                          setDropdownOpen(index);
                        }
                      }}
                      className="p-0.5 rounded hover:bg-gray-300 transition-colors"
                      title="Sheet options"
                    >
                      <ChevronDown className="h-3 w-3 text-gray-600" />
                    </button>
                    
                    {/* Dropdown menu */}
                    {dropdownOpen === index && dropdownPosition && (
                      <div 
                        ref={dropdownRef}
                        className="fixed bg-white border border-gray-300 rounded shadow-lg min-w-[160px]"
                        style={{
                          zIndex: 9999,
                          bottom: `${dropdownPosition.bottom}px`,
                          left: `${dropdownPosition.left}px`
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => {
                            setDropdownOpen(null);
                            handleDoubleClick(index, sheet.name);
                          }}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                        >
                          Rename
                        </button>
                        {onDuplicateSheet && (
                          <button
                            onClick={() => {
                              setDropdownOpen(null);
                              onDuplicateSheet(index);
                            }}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                          >
                            Duplicate
                          </button>
                        )}
                        {onDeleteSheet && sheets.length > 1 && (
                          <>
                            <div className="border-t border-gray-200"></div>
                            <button
                              onClick={() => {
                                setDropdownOpen(null);
                                onDeleteSheet(index);
                              }}
                              className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

