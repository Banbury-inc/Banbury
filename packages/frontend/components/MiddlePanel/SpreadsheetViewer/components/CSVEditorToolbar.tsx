import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Plus,
  ChevronDown,
  Undo,
  Redo,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Grid,
  DollarSign,
  Calendar,
  Percent,
  Hash,
  Minus,
  Type,
  WrapText,
  Save,
  Download,
  MoreVertical,
  HelpCircle,
  Check,
  X,
  Filter,
  Ruler,
  BarChart3,
  Paintbrush,
  PaintBucket,
  ArrowUp,
  ArrowRight,
  ArrowDown,
  ArrowLeft,
} from 'lucide-react';
import { 
  Box, 
  IconButton, 
  Divider, 
  Menu, 
  MenuItem, 
  TextField,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { Button } from '../../../ui/button';
import styles from '../../../../styles/SimpleTiptapEditor.module.css';

type WrapOption = 'overflow' | 'wrap' | 'clip';

const wrapOptions: Array<{ value: WrapOption; label: string }> = [
  { value: 'overflow', label: 'Overflow' },
  { value: 'wrap', label: 'Wrap' },
  { value: 'clip', label: 'Clip' },
];

interface CSVEditorToolbarProps {
  // Formatting handlers
  handleUndo: () => void;
  handleRedo: () => void;
  handleCurrencyFormat: () => void;
  handleDateFormat: () => void;
  handlePercentageFormat: () => void;
  handleNumberFormat: () => void;
  handleTextFormat: () => void;
  handleDropdownFormat: () => void;
  handleBold: () => void;
  handleItalic: () => void;
  handleUnderline: () => void;
  handleAlignLeft: () => void;
  handleAlignCenter: () => void;
  handleAlignRight: () => void;
  handleMergeCells: () => void;
  handleToggleFilters: () => void;
  // Conditional formatting panel opener
  onOpenConditionalPanel: () => void;
  // Chart editor opener
  onOpenChartEditor: () => void;
  
  // Font size handlers
  fontSize: number;
  handleFontSizeChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  handleFontSizeIncrement: () => void;
  handleFontSizeDecrement: () => void;
  
  // Style handlers
  applyCellStyle: (property: string, value: any) => void;
  removeCellStyle: (property: string) => void;
  applyBordersOption: (option: 'all' | 'outer' | 'inner' | 'top' | 'right' | 'bottom' | 'left' | 'thick-outer' | 'dashed-outer' | 'none') => void;
  
  // Border state
  borderStyle: 'thin' | 'thick' | 'dashed';
  setBorderStyle: (style: 'thin' | 'thick' | 'dashed') => void;
  
  // Document actions
  onSaveDocument?: () => void;
  onDownloadDocument?: () => void;
  saving?: boolean;
  canSave?: boolean;
  
  // Theme
  lightMode?: boolean;
  
  // Help dialog
  setHelpDialogOpen: (open: boolean) => void;
}

const CSVEditorToolbar: React.FC<CSVEditorToolbarProps> = ({
  handleUndo,
  lightMode: lightModeProp = true,
  handleRedo,
  onOpenChartEditor,
  handleCurrencyFormat,
  handleDateFormat,
  handlePercentageFormat,
  handleNumberFormat,
  handleTextFormat,
  handleDropdownFormat,
  handleBold,
  handleItalic,
  handleUnderline,
  handleAlignLeft,
  handleAlignCenter,
  handleAlignRight,
  handleMergeCells,
  handleToggleFilters,
  onOpenConditionalPanel,
  fontSize,
  handleFontSizeChange,
  handleFontSizeIncrement,
  handleFontSizeDecrement,
  applyCellStyle,
  removeCellStyle,
  applyBordersOption,
  borderStyle,
  setBorderStyle,
  onSaveDocument,
  onDownloadDocument,
  saving = false,
  canSave = false,
  setHelpDialogOpen,
}) => {
  // Use theme to determine light/dark mode
  const theme = useTheme();
  const lightMode = theme.palette.mode === 'light';
  
  // Toolbar-specific state
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [overflowAnchorEl, setOverflowAnchorEl] = useState<null | HTMLElement>(null);
  const [helpDialogOpen, setLocalHelpDialogOpen] = useState(false);
  
  // Color menu state
  const [isTextColorOpen, setIsTextColorOpen] = useState(false);
  const [textColorMenuPosition, setTextColorMenuPosition] = useState<{ top: number; left: number } | null>(null);
  const [fillColorAnchorEl, setFillColorAnchorEl] = useState<null | HTMLElement>(null);
  
  // Other menu state
  const [borderAnchorEl, setBorderAnchorEl] = useState<null | HTMLElement>(null);
  const [alignmentAnchorEl, setAlignmentAnchorEl] = useState<null | HTMLElement>(null);
  const [wrapAnchorEl, setWrapAnchorEl] = useState<null | HTMLElement>(null);

  // Toolbar persistent selections
  const [selectedWrapOption, setSelectedWrapOption] = useState<WrapOption>('overflow');
  
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Color handlers
  const handleTextColorClick = (event: React.MouseEvent<HTMLElement>) => {
    setTextColorMenuPosition({ top: event.clientY + 8, left: event.clientX });
    setIsTextColorOpen(true);
  };
  const handleTextColorClose = () => setIsTextColorOpen(false);
  const handleBackgroundColorClick = (event: React.MouseEvent<HTMLElement>) => {
    setFillColorAnchorEl(event.currentTarget);
  };
  const handleBackgroundColorClose = () => setFillColorAnchorEl(null);

  // Border handlers
  const handleBorderClick = (event: React.MouseEvent<HTMLElement>) => {
    setBorderAnchorEl(event.currentTarget);
  };
  const handleBorderClose = () => setBorderAnchorEl(null);

  // Alignment handlers
  const handleAlignmentClick = (event: React.MouseEvent<HTMLElement>) => {
    setAlignmentAnchorEl(event.currentTarget);
  };
  const handleAlignmentClose = () => {
    setAlignmentAnchorEl(null);
  };
  const handleAlignmentSelect = (alignment: 'left' | 'center' | 'right') => {
    switch (alignment) {
      case 'left':
        handleAlignLeft();
        break;
      case 'center':
        handleAlignCenter();
        break;
      case 'right':
        handleAlignRight();
        break;
    }
    handleAlignmentClose();
  };

  const handleWrapClick = (event: React.MouseEvent<HTMLElement>) => {
    setWrapAnchorEl(event.currentTarget);
  };
  const handleWrapClose = () => setWrapAnchorEl(null);

  const resetWrapStyles = () => {
    const wrapStyleProperties: Array<'whiteSpace' | 'overflow' | 'textOverflow' | 'wordBreak' | 'overflowWrap'> = [
      'whiteSpace',
      'overflow',
      'textOverflow',
      'wordBreak',
      'overflowWrap'
    ];
    wrapStyleProperties.forEach(property => {
      try {
        removeCellStyle(property);
      } catch (error) {
        console.error('Error clearing wrap style property:', property, error);
      }
    });
  };

  const handleWrapSelect = (option: WrapOption) => {
    setSelectedWrapOption(option);
    handleWrapClose();

    try {
      resetWrapStyles();

      if (option === 'overflow') {
        applyCellStyle('whiteSpace', 'nowrap');
        applyCellStyle('overflow', 'visible');
        applyCellStyle('textOverflow', 'clip');
        applyCellStyle('wordBreak', 'normal');
        applyCellStyle('overflowWrap', 'normal');
        return;
      }

      if (option === 'wrap') {
        applyCellStyle('whiteSpace', 'normal');
        applyCellStyle('wordBreak', 'break-word');
        applyCellStyle('overflow', 'hidden');
        applyCellStyle('textOverflow', 'clip');
        applyCellStyle('overflowWrap', 'anywhere');
        return;
      }

      applyCellStyle('whiteSpace', 'nowrap');
      applyCellStyle('overflow', 'hidden');
      applyCellStyle('textOverflow', 'clip');
    } catch (error) {
      console.error('Error applying wrap option:', option, error);
    }
  };

  // Help dialog handlers
  const handleOpenHelpDialog = () => {
    setLocalHelpDialogOpen(true);
    setHelpDialogOpen(true);
  };
  const handleCloseHelpDialog = () => {
    setLocalHelpDialogOpen(false);
    setHelpDialogOpen(false);
  };

  // Define all toolbar buttons with their handlers and icons
  const toolbarButtons = [
    { id: 'undo', handler: () => handleUndo(), icon: <Undo size={16} />, title: 'Undo (Ctrl+Z)' },
    { id: 'redo', handler: () => handleRedo(), icon: <Redo size={16} />, title: 'Redo (Ctrl+Y)' },
    { id: 'currency', handler: () => handleCurrencyFormat(), icon: <DollarSign size={16} />, title: 'Currency Format' },
    { id: 'date', handler: () => handleDateFormat(), icon: <Calendar size={16} />, title: 'Date Format' },
    { id: 'percentage', handler: () => handlePercentageFormat(), icon: <Percent size={16} />, title: 'Percentage Format' },
    { id: 'number', handler: () => handleNumberFormat(), icon: <Hash size={16} />, title: 'Number Format' },
    { id: 'text', handler: () => handleTextFormat(), icon: <Type size={16} />, title: 'Text Format' },
    { id: 'dropdown', handler: () => handleDropdownFormat(), icon: <ChevronDown size={16} />, title: 'Dropdown Format' },
    { id: 'bold', handler: () => handleBold(), icon: <Bold size={16} />, title: 'Bold (Ctrl+B)' },
    { id: 'italic', handler: () => handleItalic(), icon: <Italic size={16} />, title: 'Italic (Ctrl+I)' },
    { id: 'underline', handler: () => handleUnderline(), icon: <Underline size={16} />, title: 'Underline (Ctrl+U)' },
    { id: 'textColor', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleTextColorClick(e) : handleTextColorClick({} as any), icon: <Paintbrush size={16} />, title: 'Text Color' },
    { id: 'fillColor', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleBackgroundColorClick(e) : handleBackgroundColorClick({} as any), icon: <PaintBucket size={16} />, title: 'Fill Color' },
    { id: 'borders', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleBorderClick(e) : handleBorderClick({} as any), icon: <Grid size={16} />, title: 'Borders' },
    { id: 'merge', handler: () => handleMergeCells(), icon: <Grid size={16} />, title: 'Merge Selected Cells' },
    { id: 'wrap', handler: (event?: React.MouseEvent<HTMLElement>) => { if (event) handleWrapClick(event); }, icon: <WrapText size={16} />, title: 'Text Wrapping' },
    { id: 'alignment', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleAlignmentClick(e) : handleAlignmentClick({} as any), icon: <><AlignLeft size={16} /><ChevronDown size={12} /></>, title: 'Text Alignment' },
    { id: 'filters', handler: () => handleToggleFilters(), icon: <Filter size={16} />, title: 'Toggle Filters (Ctrl+K)' },
    { id: 'conditional', handler: () => onOpenConditionalPanel(), icon: <Ruler size={16} />, title: 'Conditional Formatting' },
    { id: 'chart', handler: () => onOpenChartEditor(), icon: <BarChart3 size={16} />, title: 'Insert Chart' },
  ];

  // Calculate which buttons should be visible based on available space
  const calculateVisibleButtons = useCallback(() => {
    if (!toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const toolbarWidth = toolbar.offsetWidth;
    
    // If toolbar width is 0, it's not rendered yet - show all buttons as fallback
    if (toolbarWidth === 0) {
      setVisibleButtons(toolbarButtons.map(btn => btn.id));
      return;
    }
    
    const buttonWidth = 32; // Width of each button
    const dividerWidth = 16; // Width of dividers
    const overflowButtonWidth = 40; // Width of overflow button
    const saveButtonsWidth = 80; // Approximate width for save/download buttons
    const fontControlWidth = 120; // Width of font size control
    
    // Reserve space for font control, save buttons and overflow button
    const availableWidth = toolbarWidth - fontControlWidth - saveButtonsWidth - overflowButtonWidth - 32; // 32px for padding
    
    // Calculate how many buttons can fit
    let currentWidth = 0;
    const visible: string[] = [];
    
    for (const button of toolbarButtons) {
      // Check if this button needs a divider before it
      const dividerGroups = ['bold', 'textColor', 'borders', 'merge', 'wrap', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
      const needsDivider = dividerGroups.includes(button.id);
      
      const buttonTotalWidth = buttonWidth + (needsDivider ? dividerWidth : 0);
      
      if (currentWidth + buttonTotalWidth <= availableWidth) {
        visible.push(button.id);
        currentWidth += buttonTotalWidth;
      } else {
        break;
      }
    }
    
    // Ensure at least some essential buttons are always visible
    if (visible.length === 0) {
      // Fallback: show at least the first few essential buttons
      const essentialButtons = ['undo', 'redo', 'bold', 'italic', 'underline'];
      setVisibleButtons(essentialButtons.filter(id => toolbarButtons.some(btn => btn.id === id)));
    } else {
      setVisibleButtons(visible);
    }
    
  }, []);

  // Handle overflow menu
  const handleOverflowClick = (event: React.MouseEvent<HTMLElement>) => {
    setOverflowAnchorEl(event.currentTarget);
  };
  const handleOverflowClose = () => {
    setOverflowAnchorEl(null);
  };

  // Recalculate visible buttons on resize and after mount
  useEffect(() => {
    // Show all buttons immediately as fallback
    setVisibleButtons(toolbarButtons.map(btn => btn.id));
    
    // Initial calculation with a delay to ensure DOM is ready
    const initialTimer = setTimeout(() => {
      calculateVisibleButtons();
    }, 100);
    
    const handleResize = () => {
      setTimeout(() => {
        calculateVisibleButtons();
      }, 50);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Use ResizeObserver for more accurate container size changes
    let resizeObserver: ResizeObserver;
    if (toolbarRef.current && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        setTimeout(() => {
          calculateVisibleButtons();
        }, 50);
      });
      resizeObserver.observe(toolbarRef.current);
    }
    
    return () => {
      clearTimeout(initialTimer);
      window.removeEventListener('resize', handleResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [calculateVisibleButtons]);

  // Keyboard shortcuts help data
  const keyboardShortcuts = [
    { shortcut: 'Ctrl+B', description: 'Bold text' },
    { shortcut: 'Ctrl+I', description: 'Italic text' },
    { shortcut: 'Ctrl+U', description: 'Underline text' },
    { shortcut: 'Ctrl+S', description: 'Save document' },
    { shortcut: 'Ctrl+Z', description: 'Undo' },
    { shortcut: 'Ctrl+Y', description: 'Redo' },
    { shortcut: 'Ctrl+C', description: 'Copy' },
    { shortcut: 'Ctrl+V', description: 'Paste' },
    { shortcut: 'Ctrl+X', description: 'Cut' },
    { shortcut: 'Ctrl+A', description: 'Select all' },
    { shortcut: 'Ctrl+F', description: 'Search' },
    { shortcut: 'Ctrl+K', description: 'Toggle filters' },
    { shortcut: 'Shift+Enter', description: 'Add row' },
    { shortcut: 'Shift+=', description: 'Add column' },
    { shortcut: 'Insert', description: 'Add row' },
    { shortcut: 'Delete', description: 'Clear selected cells' },
    { shortcut: 'F2', description: 'Edit cell' },
    { shortcut: 'Escape', description: 'Cancel editing' },
  ];

  return (
    <>
      {/* Responsive Toolbar */}
      <Box 
        ref={toolbarRef}
        data-role="csv-toolbar"
        sx={{ 
          borderBottom: 'none',
          backgroundColor: 'var(--accent)',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 1,
          overflow: 'hidden',
        }}
      >
        {/* Visible Toolbar Buttons */}
        {toolbarButtons.map((button, index) => {
          if (visibleButtons.includes(button.id)) {
            const showDividerBefore = () => {
              // Show divider before these button groups
              const dividerGroups = ['currency','textColor', 'wrap', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
              return dividerGroups.includes(button.id);
            };

            return (
              <React.Fragment key={button.id}>
                {showDividerBefore() && (
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
                )}
                <Button
                  variant="primary"
                  size="icon-sm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    try {
                      // For handlers that need event parameters, pass them through
                      if (button.id === 'textColor' || button.id === 'fillColor' || button.id === 'borders' || button.id === 'wrap' || button.id === 'alignment') {
                        button.handler(e as any);
                      } else {
                        button.handler();
                      }
                    } catch (error) {
                      console.error('Error executing button handler:', button.id, error);
                    }
                  }}
                  title={button.title}
                >
                  {button.icon}
                </Button>
                
                                 {/* Font Size Control - Positioned after text format button */}
                 {button.id === 'text' && (
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <IconButton
                       size="small"
                       onClick={handleFontSizeDecrement}
                       title="Decrease Font Size"
                       sx={{
                         width: 24,
                         height: 24,
                         color: '#9ca3af',
                         borderRadius: '2px 0 0 2px',
                         border: '1px solid #3f3f46',
                         borderRight: 'none',
                         '&:hover': {
                           backgroundColor: '#e2e8f0',
                           color: '#475569',
                         },
                       }}
                     >
                       <Minus size={12} />
                     </IconButton>
                     <TextField
                       value={fontSize}
                       onChange={handleFontSizeChange}
                       size="small"
                       inputProps={{
                         min: 6,
                         max: 72,
                         type: 'number',
                         style: {
                           textAlign: 'center',
                           padding: '2px 4px',
                           fontSize: '12px',
                           width: '32px',
                           height: '20px',
                           border: 'none',
                           outline: 'none',
                         }
                       }}
                       sx={{
                         '& .MuiOutlinedInput-root': {
                           height: '24px',
                           border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46',
                           borderRadius: 0,
                           backgroundColor: lightMode ? 'white' : 'transparent',
                           '& fieldset': {
                             border: 'none',
                           },
                           '&:hover fieldset': {
                             border: 'none',
                           },
                           '&.Mui-focused fieldset': {
                             border: 'none',
                           },
                         },
                         '& .MuiInputBase-input': {
                           padding: 0,
                           color: lightMode ? '#334155' : '#f3f4f6',
                           '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                             WebkitAppearance: 'none',
                             margin: 0,
                           },
                           '&[type=number]': {
                             MozAppearance: 'textfield',
                           },
                         },
                       }}
                     />
                     <IconButton
                       size="small"
                       onClick={handleFontSizeIncrement}
                       title="Increase Font Size"
                       sx={{
                         width: 24,
                         height: 24,
                         color: '#9ca3af',
                         borderRadius: '0 2px 2px 0',
                         border: '1px solid #3f3f46',
                         borderLeft: 'none',
                         '&:hover': {
                           backgroundColor: '#e2e8f0',
                           color: '#475569',
                         },
                       }}
                     >
                       <Plus size={12} />
                     </IconButton>
                   </Box>
                 )}
              </React.Fragment>
            );
          }
          return null;
        })}

        {/* Overflow Button */}
        {toolbarButtons.some(button => !visibleButtons.includes(button.id)) && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <Button
              variant="primary"
              size="icon-sm"
              onClick={handleOverflowClick}
              title="More tools"
            >
              <MoreVertical size={16} />
            </Button>
          </>
        )}

        {/* Document Actions - Save and Download */}
        {(onSaveDocument || onDownloadDocument) && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: '#3f3f46' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              {onSaveDocument && (
                <Button
                  variant="primary"
                  size="icon-sm"
                  onClick={onSaveDocument}
                  disabled={saving || !canSave}
                  title="Save spreadsheet (Ctrl+S)"
                >
                  <Save size={16} />
                </Button>
              )}
              {onDownloadDocument && (
                <Button
                  variant="primary"
                  size="icon-sm"
                  onClick={onDownloadDocument}
                  title="Download spreadsheet"
                >
                  <Download size={16} />
                </Button>
              )}
              <Button
                variant="primary"
                size="icon-sm"
                onClick={handleOpenHelpDialog}
                title="Keyboard shortcuts (F1)"
              >
                <HelpCircle size={16} />
              </Button>
            </Box>
          </>
        )}
      </Box>

      {/* Overflow Menu */}
      <Menu
        anchorEl={overflowAnchorEl}
        open={Boolean(overflowAnchorEl)}
        onClose={handleOverflowClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            minWidth: '200px',
            maxHeight: '400px',
            overflow: 'auto',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #3f3f46',
            backgroundColor: lightMode ? 'white' : '#27272a',
          }
        }}
      >
        {toolbarButtons
          .filter(button => !visibleButtons.includes(button.id))
          .map((button) => (
            <MenuItem
              key={button.id}
              onClick={(e: React.MouseEvent<HTMLLIElement> | React.MouseEvent<HTMLButtonElement>) => {
                handleOverflowClose();
                // For handlers that need event parameters, we need to handle them specially
                if (button.id === 'textColor' || button.id === 'fillColor' || button.id === 'borders' || button.id === 'wrap' || button.id === 'alignment') {
                  // These handlers need event parameters, so we'll trigger them differently
                  if (button.id === 'textColor') {
                    handleTextColorClick(e as any);
                  } else if (button.id === 'fillColor') {
                    handleBackgroundColorClick(e as any);
                  } else if (button.id === 'borders') {
                    handleBorderClick(e as any);
                  } else if (button.id === 'wrap') {
                    handleWrapClick(e as any);
                  } else if (button.id === 'alignment') {
                    handleAlignmentClick(e as any);
                  }
                } else {
                  button.handler();
                }
              }}
              sx={{
                fontSize: '14px',
                py: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              {button.icon}
              {button.title}
            </MenuItem>
          ))}
      </Menu>

      {/* Wrap Menu */}
      <Menu
        anchorEl={wrapAnchorEl}
        open={Boolean(wrapAnchorEl)}
        onClose={handleWrapClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{
          sx: {
            minWidth: '180px',
            border: '1px solid #3f3f46',
            backgroundColor: lightMode ? 'white' : '#27272a',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }
        }}
      >
        {wrapOptions.map(option => (
          <MenuItem
            key={option.value}
            onClick={() => handleWrapSelect(option.value)}
            sx={{
              fontSize: '14px',
              py: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
              <Typography variant="body2">
                {option.label}
              </Typography>
              {selectedWrapOption === option.value && <Check size={16} />}
            </Box>
          </MenuItem>
        ))}
      </Menu>

      {/* Text Color Menu */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={textColorMenuPosition || { top: 0, left: 0 }}
        open={isTextColorOpen}
        onClose={handleTextColorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: '220px', p: 1, backgroundColor: lightMode ? 'white' : '#27272a', border: '1px solid #3f3f46' } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: '6px', p: 1 }} onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}>
          {['#000000','#333333','#666666','#999999','#CCCCCC','#FFFFFF',
            '#E53935','#D81B60','#8E24AA','#5E35B1','#3949AB','#1E88E5','#039BE5','#00ACC1','#00897B','#43A047','#7CB342','#C0CA33','#FDD835','#FB8C00']
            .map((c) => (
              <Box key={c}
                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  handleTextColorClose(); 
                  // Use requestAnimationFrame to defer the style application
                  requestAnimationFrame(() => applyCellStyle('color', c)); 
                }}
                sx={{ width: 18, height: 18, backgroundColor: c, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
            ))}
        </Box>
        <Divider />
        <MenuItem onMouseDown={(e: React.MouseEvent<HTMLLIElement>) => e.preventDefault()} onClick={() => { handleTextColorClose(); setTimeout(() => removeCellStyle('color'), 0); }}>Clear text color</MenuItem>
      </Menu>

      {/* Conditional Formatting Popover was removed; opening a right-side panel instead */}

      {/* Fill Color Menu */}
      <Menu
        anchorEl={fillColorAnchorEl}
        open={Boolean(fillColorAnchorEl)}
        onClose={handleBackgroundColorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: '220px', p: 1, backgroundColor: lightMode ? 'white' : '#27272a', border: '1px solid #3f3f46' } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(10, 18px)', gap: '6px', p: 1 }} onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => e.preventDefault()}>
          {['#000000','#333333','#666666','#999999','#CCCCCC','#FFFFFF',
            '#E53935','#D81B60','#8E24AA','#5E35B1','#3949AB','#1E88E5','#039BE5','#00ACC1','#00897B','#43A047','#7CB342','#C0CA33','#FDD835','#FB8C00']
            .map((c) => (
              <Box key={c}
                onMouseDown={(e: React.MouseEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); }}
                onClick={(e: React.MouseEvent<HTMLDivElement>) => { 
                  e.preventDefault(); 
                  e.stopPropagation(); 
                  handleBackgroundColorClose(); 
                  // Use requestAnimationFrame to defer the style application
                  requestAnimationFrame(() => applyCellStyle('backgroundColor', c)); 
                }}
                sx={{ width: 18, height: 18, backgroundColor: c, border: '1px solid #e5e7eb', cursor: 'pointer' }} />
            ))}
        </Box>
        <Divider />
        <MenuItem onMouseDown={(e: React.MouseEvent<HTMLLIElement>) => e.preventDefault()} onClick={() => { handleBackgroundColorClose(); setTimeout(() => removeCellStyle('backgroundColor'), 0); }}>Clear fill color</MenuItem>
      </Menu>

      {/* Borders Menu */}
      <Menu
        anchorEl={borderAnchorEl}
        open={Boolean(borderAnchorEl)}
        onClose={handleBorderClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: '260px', border: '1px solid #3f3f46', backgroundColor: lightMode ? 'white' : '#27272a', p: 1 } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 40px)', gap: 1, p: 1 }}>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('all')} title="All borders"><Grid size={18} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('outer')} title="Outer borders"><Grid size={18} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('inner')} title="Inner borders"><Grid size={18} /></IconButton>
          <Box />
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('none')} title="Clear borders"><X size={18} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('top')} title="Top border"><ArrowUp size={18} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('right')} title="Right border"><ArrowRight size={18} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('bottom')} title="Bottom border"><ArrowDown size={18} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('left')} title="Left border"><ArrowLeft size={18} /></IconButton>
          <Box />
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>Style</Typography>
          <IconButton size="small" onClick={() => setBorderStyle('thin')} title="Thin"><Minus size={18} style={{ borderBottom: '1px solid currentColor', width: 18 }} /></IconButton>
          <IconButton size="small" onClick={() => setBorderStyle('thick')} title="Thick"><Minus size={18} style={{ borderBottom: '3px solid currentColor', width: 18 }} /></IconButton>
          <IconButton size="small" onClick={() => setBorderStyle('dashed')} title="Dashed"><Minus size={18} style={{ borderBottom: '1px dashed currentColor', width: 18 }} /></IconButton>
        </Box>
      </Menu>

      {/* Alignment Menu */}
      <Menu
        anchorEl={alignmentAnchorEl}
        open={Boolean(alignmentAnchorEl)}
        onClose={handleAlignmentClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        PaperProps={{
          sx: {
            minWidth: '120px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            border: '1px solid #3f3f46',
            backgroundColor: lightMode ? 'white' : '#27272a',
          }
        }}
      >
        <MenuItem 
          onClick={() => handleAlignmentSelect('left')}
          sx={{ 
            fontSize: '14px',
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AlignLeft size={16} />
          Align Left
        </MenuItem>
        <MenuItem 
          onClick={() => handleAlignmentSelect('center')}
          sx={{ 
            fontSize: '14px',
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AlignCenter size={16} />
          Align Center
        </MenuItem>
        <MenuItem 
          onClick={() => handleAlignmentSelect('right')}
          sx={{ 
            fontSize: '14px',
            py: 1,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <AlignRight size={16} />
          Align Right
        </MenuItem>
      </Menu>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={handleCloseHelpDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Keyboard Shortcuts
        </DialogTitle>
        <DialogContent>
          <List>
            {keyboardShortcuts.map((item, index) => (
              <ListItem key={index} sx={{ py: 0.5 }}>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.shortcut}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {item.description}
                      </Typography>
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHelpDialog}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CSVEditorToolbar;
