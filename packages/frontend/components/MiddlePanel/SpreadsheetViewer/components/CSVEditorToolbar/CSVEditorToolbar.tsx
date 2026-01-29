import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  Undo,
  Redo,
  DollarSign,
  Calendar,
  Percent,
  Hash,
  Type,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  Paintbrush,
  PaintBucket,
  Grid,
  WrapText,
  AlignLeft,
  Filter,
  Ruler,
  BarChart3,
} from 'lucide-react';
import { 
  Box, 
  Divider, 
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Button
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UndoButton } from './components/UndoButton';
import { RedoButton } from './components/RedoButton';
import { CurrencyFormatButton } from './components/CurrencyFormatButton';
import { DateFormatButton } from './components/DateFormatButton';
import { PercentageFormatButton } from './components/PercentageFormatButton';
import { NumberFormatButton } from './components/NumberFormatButton';
import { TextFormatButton } from './components/TextFormatButton';
import { DropdownFormatButton } from './components/DropdownFormatButton';
import { BoldButton } from './components/BoldButton';
import { ItalicButton } from './components/ItalicButton';
import { UnderlineButton } from './components/UnderlineButton';
import { TextColorButton } from './components/TextColorButton';
import { FillColorButton } from './components/FillColorButton';
import { BordersButton } from './components/BordersButton';
import { MergeCellsButton } from './components/MergeCellsButton';
import { WrapButton } from './components/WrapButton';
import { AlignmentButton } from './components/AlignmentButton';
import { FiltersButton } from './components/FiltersButton';
import { ConditionalFormattingButton } from './components/ConditionalFormattingButton';
import { ChartButton } from './components/ChartButton';
import { ShareButton } from './components/ShareButton';
import { SaveButton } from './components/SaveButton';
import { DownloadButton } from './components/DownloadButton';
import { HelpButton } from './components/HelpButton';
import { OverflowButton } from './components/OverflowButton';
import { FontSizeControl } from './components/FontSizeControl';


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
  onShareDocument?: () => void;
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
  onShareDocument,
  saving = false,
  canSave = false,
  setHelpDialogOpen,
}) => {
  // Use theme to determine light/dark mode
  const theme = useTheme();
  const lightMode = theme.palette.mode === 'light';
  
  // Toolbar-specific state
  const [visibleButtons, setVisibleButtons] = useState<string[]>([]);
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [helpDialogOpen, setLocalHelpDialogOpen] = useState(false);
  
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Help dialog handlers
  const handleOpenHelpDialog = () => {
    setLocalHelpDialogOpen(true);
    setHelpDialogOpen(true);
  };
  const handleCloseHelpDialog = () => {
    setLocalHelpDialogOpen(false);
    setHelpDialogOpen(false);
  };

  // Define button order for visibility calculation
  const buttonOrder = [
    'undo',
    'redo',
    'currency',
    'date',
    'percentage',
    'number',
    'text',
    'dropdown',
    'bold',
    'italic',
    'underline',
    'textColor',
    'fillColor',
    'borders',
    'merge',
    'wrap',
    'alignment',
    'filters',
    'conditional',
    'chart',
  ];

  // Overflow menu button definitions
  const overflowButtonDefs: Record<string, { icon: React.ReactNode; title: string; handler: (e?: React.MouseEvent<HTMLElement>) => void }> = {
    undo: { icon: <Undo size={16} />, title: 'Undo (Ctrl+Z)', handler: () => handleUndo() },
    redo: { icon: <Redo size={16} />, title: 'Redo (Ctrl+Y)', handler: () => handleRedo() },
    currency: { icon: <DollarSign size={16} />, title: 'Currency Format', handler: () => handleCurrencyFormat() },
    date: { icon: <Calendar size={16} />, title: 'Date Format', handler: () => handleDateFormat() },
    percentage: { icon: <Percent size={16} />, title: 'Percentage Format', handler: () => handlePercentageFormat() },
    number: { icon: <Hash size={16} />, title: 'Number Format', handler: () => handleNumberFormat() },
    text: { icon: <Type size={16} />, title: 'Text Format', handler: () => handleTextFormat() },
    dropdown: { icon: <ChevronDown size={16} />, title: 'Dropdown Format', handler: () => handleDropdownFormat() },
    bold: { icon: <Bold size={16} />, title: 'Bold (Ctrl+B)', handler: () => handleBold() },
    italic: { icon: <Italic size={16} />, title: 'Italic (Ctrl+I)', handler: () => handleItalic() },
    underline: { icon: <Underline size={16} />, title: 'Underline (Ctrl+U)', handler: () => handleUnderline() },
    textColor: { icon: <Paintbrush size={16} />, title: 'Text Color', handler: () => {} },
    fillColor: { icon: <PaintBucket size={16} />, title: 'Fill Color', handler: () => {} },
    borders: { icon: <Grid size={16} />, title: 'Borders', handler: () => {} },
    merge: { icon: <Grid size={16} />, title: 'Merge Selected Cells', handler: () => handleMergeCells() },
    wrap: { icon: <WrapText size={16} />, title: 'Text Wrapping', handler: () => {} },
    alignment: { icon: <><AlignLeft size={16} /><ChevronDown size={12} /></>, title: 'Text Alignment', handler: () => {} },
    filters: { icon: <Filter size={16} />, title: 'Toggle Filters (Ctrl+K)', handler: () => handleToggleFilters() },
    conditional: { icon: <Ruler size={16} />, title: 'Conditional Formatting', handler: () => onOpenConditionalPanel() },
    chart: { icon: <BarChart3 size={16} />, title: 'Insert Chart', handler: () => onOpenChartEditor() },
  };

  // Calculate which buttons should be visible based on available space
  const calculateVisibleButtons = useCallback(() => {
    if (!toolbarRef.current) return;

    const toolbar = toolbarRef.current;
    const toolbarWidth = toolbar.offsetWidth;
    
    // If toolbar width is 0, it's not rendered yet - show all buttons as fallback
    if (toolbarWidth === 0) {
      setVisibleButtons(buttonOrder);
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
    
    for (const buttonId of buttonOrder) {
      // Check if this button needs a divider before it
      const dividerGroups = ['bold', 'textColor', 'borders', 'merge', 'wrap', 'alignment', 'filters', 'cut', 'search', 'addRow', 'deleteRow', 'unmerge', 'export'];
      const needsDivider = dividerGroups.includes(buttonId);
      
      const buttonTotalWidth = buttonWidth + (needsDivider ? dividerWidth : 0);
      
      if (currentWidth + buttonTotalWidth <= availableWidth) {
        visible.push(buttonId);
        currentWidth += buttonTotalWidth;
      } else {
        break;
      }
    }
    
    // Ensure at least some essential buttons are always visible
    if (visible.length === 0) {
      // Fallback: show at least the first few essential buttons
      const essentialButtons = ['undo', 'redo', 'bold', 'italic', 'underline'];
      setVisibleButtons(essentialButtons.filter(id => buttonOrder.includes(id)));
    } else {
      setVisibleButtons(visible);
    }
    
  }, []);


  // Recalculate visible buttons on resize and after mount
  useEffect(() => {
    // Show all buttons immediately as fallback
    setVisibleButtons(buttonOrder);
    
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

  // Vim mode shortcuts (shown when Vim mode is enabled)
  const vimShortcuts = [
    // Movement
    { shortcut: 'h / j / k / l', description: 'Move cursor left/down/up/right' },
    { shortcut: 'Ctrl+J / K', description: 'Move row(s) down/up' },
    { shortcut: 'Ctrl+H / L', description: 'Move column(s) left/right' },
    { shortcut: 'Ctrl+d / u', description: 'Scroll half page down/up' },
    { shortcut: 'gg', description: 'Go to top of sheet' },
    { shortcut: 'G', description: 'Go to bottom of sheet' },
    { shortcut: '0 / $', description: 'Go to first/last column' },
    // Selection
    { shortcut: 'v', description: 'Begin selecting cells' },
    { shortcut: 'V', description: 'Begin selecting rows' },
    { shortcut: 'Alt+v', description: 'Begin selecting columns' },
    // Editing
    { shortcut: 'i', description: 'Edit cell' },
    { shortcut: 'a', description: 'Append to cell (cursor at end)' },
    { shortcut: 'u', description: 'Undo' },
    { shortcut: 'Ctrl+r', description: 'Redo' },
    { shortcut: 'o / O', description: 'Insert row below/above and edit' },
    { shortcut: 's / S', description: 'Insert row below/above' },
    { shortcut: 'dd', description: 'Delete current row (or selected rows/cols)' },
    { shortcut: 'x', description: 'Clear cell contents' },
    { shortcut: 'yy', description: 'Copy current row (or selected rows/cols)' },
    { shortcut: 'yc', description: 'Copy selected cells' },
    { shortcut: 'p', description: 'Paste' },
    // Formatting
    { shortcut: ';al / ;ac / ;ar', description: 'Align left/center/right' },
    { shortcut: ';ww / ;wo / ;wc', description: 'Wrap/Overflow/Clip cell' },
    // Other
    { shortcut: '?', description: 'Show help dialog' },
    { shortcut: ';wf', description: 'Toggle full screen' },
    { shortcut: ';o', description: 'Open URL in cell' },
  ];

  return (
    <>
      {/* Responsive Toolbar */}
      <Box 
        ref={toolbarRef}
        data-role="csv-toolbar"
        className="bg-card"
        sx={{ 
          borderBottom: 'none',
          display: 'flex',
          alignItems: 'center',
          gap: 0.5,
          px: 1.5,
          py: 1,
          overflow: 'hidden',
        }}
      >
        {/* Visible Toolbar Buttons */}
        {visibleButtons.includes('undo') && (
          <UndoButton onClick={handleUndo} />
        )}
        {visibleButtons.includes('redo') && (
          <RedoButton onClick={handleRedo} />
        )}
        {visibleButtons.includes('currency') && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <CurrencyFormatButton onClick={handleCurrencyFormat} />
          </>
        )}
        {visibleButtons.includes('date') && (
          <DateFormatButton onClick={handleDateFormat} />
        )}
        {visibleButtons.includes('percentage') && (
          <PercentageFormatButton onClick={handlePercentageFormat} />
        )}
        {visibleButtons.includes('number') && (
          <NumberFormatButton onClick={handleNumberFormat} />
        )}
        {visibleButtons.includes('text') && (
          <>
            <TextFormatButton onClick={handleTextFormat} />
            <FontSizeControl
              fontSize={fontSize}
              handleFontSizeChange={handleFontSizeChange}
              handleFontSizeIncrement={handleFontSizeIncrement}
              handleFontSizeDecrement={handleFontSizeDecrement}
            />
          </>
        )}
        {visibleButtons.includes('dropdown') && (
          <DropdownFormatButton onClick={handleDropdownFormat} />
        )}
        {visibleButtons.includes('bold') && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <BoldButton onClick={handleBold} />
          </>
        )}
        {visibleButtons.includes('italic') && (
          <ItalicButton onClick={handleItalic} />
        )}
        {visibleButtons.includes('underline') && (
          <UnderlineButton onClick={handleUnderline} />
        )}
        {visibleButtons.includes('textColor') && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <TextColorButton
              applyCellStyle={applyCellStyle}
              removeCellStyle={removeCellStyle}
            />
          </>
        )}
        {visibleButtons.includes('fillColor') && (
          <FillColorButton
            applyCellStyle={applyCellStyle}
            removeCellStyle={removeCellStyle}
          />
        )}
        {visibleButtons.includes('borders') && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <BordersButton
              applyBordersOption={applyBordersOption}
              borderStyle={borderStyle}
              setBorderStyle={setBorderStyle}
            />
          </>
        )}
        {visibleButtons.includes('merge') && (
          <MergeCellsButton onClick={handleMergeCells} />
        )}
        {visibleButtons.includes('wrap') && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <WrapButton
              applyCellStyle={applyCellStyle}
              removeCellStyle={removeCellStyle}
            />
          </>
        )}
        {visibleButtons.includes('alignment') && (
          <AlignmentButton
            handleAlignLeft={handleAlignLeft}
            handleAlignCenter={handleAlignCenter}
            handleAlignRight={handleAlignRight}
          />
        )}
        {visibleButtons.includes('filters') && (
          <>
            <Divider orientation="vertical" flexItem sx={{ mx: 0.5, borderColor: '#3f3f46' }} />
            <FiltersButton onClick={handleToggleFilters} />
          </>
        )}
        {visibleButtons.includes('conditional') && (
          <ConditionalFormattingButton onClick={onOpenConditionalPanel} />
        )}
        {visibleButtons.includes('chart') && (
          <ChartButton onClick={onOpenChartEditor} />
        )}

        {/* Overflow Button */}
        <OverflowButton
          buttonOrder={buttonOrder}
          visibleButtons={visibleButtons}
          overflowButtonDefs={overflowButtonDefs}
          overflowOpen={overflowOpen}
          setOverflowOpen={setOverflowOpen}
        />

        {/* Document Actions - Share, Save and Download */}
        {(onShareDocument || onSaveDocument || onDownloadDocument) && (
          <>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
              {onShareDocument && (
                <ShareButton onClick={onShareDocument} />
              )}
              {onSaveDocument && (
                <SaveButton onClick={onSaveDocument} disabled={saving || !canSave} />
              )}
              {onDownloadDocument && (
                <DownloadButton onClick={onDownloadDocument} />
              )}
              <HelpButton onClick={handleOpenHelpDialog} />
            </Box>
          </>
        )}
      </Box>

      {/* Keyboard Shortcuts Help Dialog */}
      <Dialog
        open={helpDialogOpen}
        onClose={handleCloseHelpDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Keyboard Shortcuts
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 4 }}>
            {/* Standard Shortcuts */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Standard Shortcuts
              </Typography>
              <List dense>
                {keyboardShortcuts.map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '12px' }}>
                            {item.shortcut}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', ml: 2 }}>
                            {item.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
            {/* Vim Mode Shortcuts */}
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                Vim Mode Shortcuts
              </Typography>
              <List dense>
                {vimShortcuts.map((item, index) => (
                  <ListItem key={index} sx={{ py: 0.25 }}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontFamily: 'monospace', fontSize: '12px' }}>
                            {item.shortcut}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '12px', ml: 2 }}>
                            {item.description}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Box>
          </Box>
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
