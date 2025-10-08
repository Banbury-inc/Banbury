import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Add,
  ArrowDropDown,
  Undo,
  Redo,
  FormatBold,
  FormatItalic,
  FormatUnderlined,
  FormatAlignLeft,
  FormatAlignCenter,
  FormatAlignRight,
  BorderAll,
  AttachMoney,
  CalendarToday,
  Percent,
  Numbers,
  KeyboardArrowDown,
  Remove,
  TextFormat,
  BorderTop,
  BorderRight,
  BorderBottom,
  BorderLeft,
  Save,
  Download,
  MoreVert,
  Help,
  Clear,
  FilterList,
  Rule,
  BarChart,
} from '@mui/icons-material';
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
import { Button } from '../../../../components/ui/button';
import styles from '../../../../styles/SimpleTiptapEditor.module.css';
// Import custom SVG icons
const MergeCellsIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: sx?.fontSize || 16,
      height: sx?.fontSize || 16,
      fill: 'currentColor',
      ...sx
    }}
  >
    <path d="M3.1,9h1.8C4.955,9,5,8.955,5,8.9V6.1C5,6.045,5.045,6,5.1,6h5.8C10.955,6,11,5.955,11,5.9V4.1C11,4.045,10.955,4,10.9,4H3.1C3.045,4,3,4.045,3,4.1v4.8C3,8.955,3.045,9,3.1,9z M13,4.1v1.8C13,5.955,13.045,6,13.1,6h5.8C18.955,6,19,6.045,19,6.1v2.8C19,8.955,19.045,9,19.1,9h1.8C20.955,9,21,8.955,21,8.9V4.1C21,4.045,20.955,4,20.9,4h-7.8C13.045,4,13,4.045,13,4.1z M18.9,18h-5.8c-0.055,0-0.1,0.045-0.1,0.1v1.8c0,0.055,0.045,0.1,0.1,0.1h7.8c0.055,0,0.1-0.045,0.1-0.1v-4.8c0-0.055-0.045-0.1-0.1-0.1h-1.8c-0.055,0-0.1,0.045-0.1,0.1v2.8C19,17.955,18.955,18,18.9,18z M4.9,15H3.1C3.045,15,3,15.045,3,15.1v4.8C3,19.955,3.045,20,3.1,20h7.8c0.055,0,0.1-0.045,0.1-0.1v-1.8c0-0.055-0.045-0.1-0.1-0.1H5.1C5.045,18,5,17.955,5,17.9v-2.8C5,15.045,4.955,15,4.9,15z M6.9,11H3.1C3.045,11,3,11.045,3,11.1v1.8C3,12.955,3.045,13,3.1,13h3.8C6.955,13,7,13.045,7,13.1v2.659c0,0.089,0.108,0.134,0.171,0.071l3.759-3.759c0.039-0.039,0.039-0.102,0-0.141L7.171,8.171C7.108,8.108,7,8.152,7,8.241V10.9C7,10.955,6.955,11,6.9,11z M16.829,8.171l-3.759,3.759c-0.039,0.039-0.039,0.102,0,0.141l3.759,3.759C16.892,15.892,17,15.848,17,15.759V13.1c0-0.055,0.045-0.1,0.1-0.1h3.8c0.055,0,0.1-0.045,0.1-0.1v-1.8c0-0.055-0.045-0.1-0.1-0.1h-3.8c-0.055,0-0.1-0.045-0.1-0.1V8.241C17,8.152,16.892,8.108,16.829,8.171z"/>
  </svg>
);

const FillColorIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: sx?.fontSize || 16,
      height: sx?.fontSize || 16,
      fill: 'currentColor',
      ...sx
    }}
  >
    <path d="M17.54,14.032c-0.019-0.023-0.047-0.036-0.077-0.036L6.582,14l-0.457-0.457l7.462-6.396c0.042-0.036,0.047-0.099,0.011-0.141l-2.953-3.429c-0.036-0.042-0.099-0.047-0.141-0.011L9.496,4.434C9.454,4.47,9.45,4.533,9.486,4.575l1.953,2.267c0.036,0.042,0.031,0.105-0.011,0.141l-7.47,6.404c-0.044,0.038-0.047,0.105-0.006,0.147l7.437,7.437c0.037,0.037,0.095,0.039,0.135,0.006l6.89-5.741c0.042-0.035,0.048-0.098,0.013-0.141L17.54,14.032z M19.5,17.309c-0.206-0.412-0.793-0.412-0.999,0c0,0-1.506,3.186,0.5,3.186S19.5,17.309,19.5,17.309z"/>
  </svg>
);

const TextColorIcon: React.FC<{ sx?: any }> = ({ sx }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    style={{
      width: sx?.fontSize || 16,
      height: sx?.fontSize || 16,
      fill: 'currentColor',
      ...sx
    }}
  >
    <path d="M9.763,13.407L9.05,15.68c-0.013,0.042-0.052,0.07-0.095,0.07h-2.72c-0.069,0-0.117-0.068-0.094-0.133l4.125-11.81c0.014-0.04,0.052-0.067,0.094-0.067h3.223c0.044,0,0.082,0.028,0.095,0.07l3.753,11.81c0.02,0.064-0.028,0.13-0.095,0.13h-2.847c-0.045,0-0.085-0.03-0.097-0.074l-0.609-2.265c-0.012-0.044-0.051-0.074-0.097-0.074H9.859C9.815,13.337,9.776,13.366,9.763,13.407z M11.807,6.754l-1.315,4.239c-0.02,0.064,0.028,0.13,0.096,0.13h2.453c0.066,0,0.114-0.062,0.097-0.126l-1.137-4.239C11.973,6.661,11.836,6.658,11.807,6.754z"/>
    <path d="M20.9,21H3.1C3.045,21,3,20.955,3,20.9v-2.8C3,18.045,3.045,18,3.1,18h17.8c0.055,0,0.1,0.045,0.1,0.1v2.8C21,20.955,20.955,21,20.9,21z"/>
  </svg>
);

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
    { id: 'undo', handler: () => handleUndo(), icon: <Undo sx={{ fontSize: 16 }} />, title: 'Undo (Ctrl+Z)' },
    { id: 'redo', handler: () => handleRedo(), icon: <Redo sx={{ fontSize: 16 }} />, title: 'Redo (Ctrl+Y)' },
    { id: 'currency', handler: () => handleCurrencyFormat(), icon: <AttachMoney sx={{ fontSize: 16 }} />, title: 'Currency Format' },
    { id: 'date', handler: () => handleDateFormat(), icon: <CalendarToday sx={{ fontSize: 16 }} />, title: 'Date Format' },
    { id: 'percentage', handler: () => handlePercentageFormat(), icon: <Percent sx={{ fontSize: 16 }} />, title: 'Percentage Format' },
    { id: 'number', handler: () => handleNumberFormat(), icon: <Numbers sx={{ fontSize: 16 }} />, title: 'Number Format' },
    { id: 'text', handler: () => handleTextFormat(), icon: <TextFormat sx={{ fontSize: 16 }} />, title: 'Text Format' },
    { id: 'dropdown', handler: () => handleDropdownFormat(), icon: <ArrowDropDown sx={{ fontSize: 16 }} />, title: 'Dropdown Format' },
    { id: 'bold', handler: () => handleBold(), icon: <FormatBold sx={{ fontSize: 16 }} />, title: 'Bold (Ctrl+B)' },
    { id: 'italic', handler: () => handleItalic(), icon: <FormatItalic sx={{ fontSize: 16 }} />, title: 'Italic (Ctrl+I)' },
    { id: 'underline', handler: () => handleUnderline(), icon: <FormatUnderlined sx={{ fontSize: 16 }} />, title: 'Underline (Ctrl+U)' },
    { id: 'textColor', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleTextColorClick(e) : handleTextColorClick({} as any), icon: <TextColorIcon sx={{ fontSize: 16 }} />, title: 'Text Color' },
    { id: 'fillColor', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleBackgroundColorClick(e) : handleBackgroundColorClick({} as any), icon: <FillColorIcon sx={{ fontSize: 16 }} />, title: 'Fill Color' },
    { id: 'borders', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleBorderClick(e) : handleBorderClick({} as any), icon: <BorderAll sx={{ fontSize: 16 }} />, title: 'Borders' },
    { id: 'merge', handler: () => handleMergeCells(), icon: <MergeCellsIcon sx={{ fontSize: 16 }} />, title: 'Merge Selected Cells' },
    { id: 'alignment', handler: (e?: React.MouseEvent<HTMLElement>) => e ? handleAlignmentClick(e) : handleAlignmentClick({} as any), icon: <><FormatAlignLeft sx={{ fontSize: 16 }} /><KeyboardArrowDown sx={{ fontSize: 12, ml: 0.5 }} /></>, title: 'Text Alignment' },
    { id: 'filters', handler: () => handleToggleFilters(), icon: <FilterList sx={{ fontSize: 16 }} />, title: 'Toggle Filters (Ctrl+K)' },
    { id: 'conditional', handler: () => onOpenConditionalPanel(), icon: <Rule sx={{ fontSize: 16 }} />, title: 'Conditional Formatting' },
    { id: 'chart', handler: () => onOpenChartEditor(), icon: <BarChart sx={{ fontSize: 16 }} />, title: 'Insert Chart' },
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
      const dividerGroups = ['bold', 'textColor', 'borders', 'merge', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
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
          backgroundColor: lightMode ? '#e4e4e7' : '#27272a',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          height: '40px',
          px: 1,
          py: 0,
          overflow: 'hidden',
        }}
      >
        {/* Visible Toolbar Buttons */}
        {toolbarButtons.map((button, index) => {
          if (visibleButtons.includes(button.id)) {
            const showDividerBefore = () => {
              // Show divider before these button groups
              const dividerGroups = ['currency','textColor', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
              return dividerGroups.includes(button.id);
            };

            return (
              <React.Fragment key={button.id}>
                {showDividerBefore() && (
                  <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: lightMode ? '#cbd5e1' : '#3f3f46' }} />
                )}
                <Button
                  variant="primary"
                  size="xsm"
                  onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                    try {
                      // For handlers that need event parameters, pass them through
                      if (button.id === 'textColor' || button.id === 'fillColor' || button.id === 'borders' || button.id === 'alignment') {
                        button.handler(e as any);
                      } else {
                        button.handler();
                      }
                    } catch (error) {
                      console.error('Error executing button handler:', button.id, error);
                    }
                  }}
                  title={button.title}
                  className={styles['toolbar-button']}
                  style={{
                    color: lightMode ? '#000000' : undefined,
                  }}
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
                         color: lightMode ? '#64748b' : '#9ca3af',
                         borderRadius: '2px 0 0 2px',
                         border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46',
                         borderRight: 'none',
                         '&:hover': {
                           backgroundColor: '#e2e8f0',
                           color: lightMode ? '#334155' : '#475569',
                         },
                       }}
                     >
                       <Remove sx={{ fontSize: 12 }} />
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
                         color: lightMode ? '#64748b' : '#9ca3af',
                         borderRadius: '0 2px 2px 0',
                         border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46',
                         borderLeft: 'none',
                         '&:hover': {
                           backgroundColor: '#e2e8f0',
                           color: lightMode ? '#334155' : '#475569',
                         },
                       }}
                     >
                       <Add sx={{ fontSize: 12 }} />
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
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: lightMode ? '#cbd5e1' : '#3f3f46' }} />
            <Button
              variant="primary"
              size="xsm"
              onClick={handleOverflowClick}
              title="More tools"
              className={styles['toolbar-button']}
              style={{
                color: lightMode ? '#64748b' : undefined,
              }}
            >
              <MoreVert sx={{ fontSize: 16 }} />
            </Button>
          </>
        )}

        {/* Document Actions - Save and Download */}
        {(onSaveDocument || onDownloadDocument) && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: lightMode ? '#cbd5e1' : '#3f3f46' }} />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              {onSaveDocument && (
                <Button
                  variant="primary"
                  size="xsm"
                  onClick={onSaveDocument}
                  disabled={saving || !canSave}
                  title="Save spreadsheet (Ctrl+S)"
                  className={styles['toolbar-button']}
                  style={{
                    color: lightMode ? '#64748b' : undefined,
                  }}
                >
                  <Save sx={{ fontSize: 16 }} />
                </Button>
              )}
              {onDownloadDocument && (
                <Button
                  variant="primary"
                  size="xsm"
                  onClick={onDownloadDocument}
                  title="Download spreadsheet"
                  className={styles['toolbar-button']}
                  style={{
                    color: lightMode ? '#64748b' : undefined,
                  }}
                >
                  <Download sx={{ fontSize: 16 }} />
                </Button>
              )}
              <Button
                variant="primary"
                size="xsm"
                onClick={handleOpenHelpDialog}
                title="Keyboard shortcuts (F1)"
                className={styles['toolbar-button']}
                style={{
                  color: lightMode ? '#64748b' : undefined,
                }}
              >
                <Help sx={{ fontSize: 16 }} />
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
            border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46',
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
                if (button.id === 'textColor' || button.id === 'fillColor' || button.id === 'borders' || button.id === 'alignment') {
                  // These handlers need event parameters, so we'll trigger them differently
                  if (button.id === 'textColor') {
                    handleTextColorClick(e as any);
                  } else if (button.id === 'fillColor') {
                    handleBackgroundColorClick(e as any);
                  } else if (button.id === 'borders') {
                    handleBorderClick(e as any);
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

      {/* Text Color Menu */}
      <Menu
        anchorReference="anchorPosition"
        anchorPosition={textColorMenuPosition || { top: 0, left: 0 }}
        open={isTextColorOpen}
        onClose={handleTextColorClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        transformOrigin={{ vertical: 'top', horizontal: 'left' }}
        PaperProps={{ sx: { minWidth: '220px', p: 1, backgroundColor: lightMode ? 'white' : '#27272a', border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46' } }}
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
        PaperProps={{ sx: { minWidth: '220px', p: 1, backgroundColor: lightMode ? 'white' : '#27272a', border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46' } }}
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
        PaperProps={{ sx: { minWidth: '260px', border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46', backgroundColor: lightMode ? 'white' : '#27272a', p: 1 } }}
      >
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 40px)', gap: 1, p: 1 }}>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('all')} title="All borders"><BorderAll sx={{ fontSize: 18 }} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('outer')} title="Outer borders"><BorderAll sx={{ fontSize: 18 }} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('inner')} title="Inner borders"><BorderAll sx={{ fontSize: 18 }} /></IconButton>
          <Box />
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('none')} title="Clear borders"><Clear sx={{ fontSize: 18 }} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('top')} title="Top border"><BorderTop sx={{ fontSize: 18 }} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('right')} title="Right border"><BorderRight sx={{ fontSize: 18 }} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('bottom')} title="Bottom border"><BorderBottom sx={{ fontSize: 18 }} /></IconButton>
          <IconButton size="small" onMouseDown={(e: React.MouseEvent<HTMLButtonElement>) => e.preventDefault()} onClick={() => applyBordersOption('left')} title="Left border"><BorderLeft sx={{ fontSize: 18 }} /></IconButton>
          <Box />
        </Box>
        <Divider sx={{ my: 1 }} />
        <Box sx={{ display: 'flex', alignItems: 'center', px: 1, gap: 1 }}>
          <Typography variant="body2" sx={{ color: '#475569' }}>Style</Typography>
          <IconButton size="small" onClick={() => setBorderStyle('thin')} title="Thin"><Remove sx={{ fontSize: 18, borderBottom: '1px solid currentColor', width: 18 }} /></IconButton>
          <IconButton size="small" onClick={() => setBorderStyle('thick')} title="Thick"><Remove sx={{ fontSize: 18, borderBottom: '3px solid currentColor', width: 18 }} /></IconButton>
          <IconButton size="small" onClick={() => setBorderStyle('dashed')} title="Dashed"><Remove sx={{ fontSize: 18, borderBottom: '1px dashed currentColor', width: 18 }} /></IconButton>
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
            border: lightMode ? '1px solid #cbd5e1' : '1px solid #3f3f46',
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
          <FormatAlignLeft sx={{ fontSize: 16 }} />
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
          <FormatAlignCenter sx={{ fontSize: 16 }} />
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
          <FormatAlignRight sx={{ fontSize: 16 }} />
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
