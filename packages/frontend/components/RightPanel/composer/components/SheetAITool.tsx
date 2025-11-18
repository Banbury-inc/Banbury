import { Table } from 'lucide-react';
import React, { useMemo } from 'react';
import { AIToolCard } from './AIToolCard';

import type { AIToolCardConfig } from './AIToolCard';

interface SheetOperationSetCell { type: 'setCell'; row: number; col: number; value: string | number }
interface SheetOperationSetRange { type: 'setRange'; range: { startRow: number; startCol: number; endRow: number; endCol: number }; values: (string | number)[][] }
interface SheetOperationInsertRows { type: 'insertRows'; index: number; count?: number }
interface SheetOperationDeleteRows { type: 'deleteRows'; index: number; count?: number }
interface SheetOperationInsertCols { type: 'insertCols'; index: number; count?: number }
interface SheetOperationDeleteCols { type: 'deleteCols'; index: number; count?: number }

type SheetOperation =
  | SheetOperationSetCell
  | SheetOperationSetRange
  | SheetOperationInsertRows
  | SheetOperationDeleteRows
  | SheetOperationInsertCols
  | SheetOperationDeleteCols;

interface SheetAIToolProps {
  args?: {
    action: string;
    sheetName?: string;
    operations?: SheetOperation[];
    csvContent?: string;
    note?: string;
  };
  action?: string;
  sheetName?: string;
  operations?: SheetOperation[];
  csvContent?: string;
  note?: string;
}

export const SheetAITool: React.FC<SheetAIToolProps> = (props) => {
  const { action, sheetName, operations, csvContent, note } = props.args || props;

  const hasContent = Boolean((csvContent && csvContent.trim().length > 0) || (operations && operations.length > 0));

  const config: AIToolCardConfig = useMemo(() => ({
    icon: Table,
    displayName: sheetName || 'Spreadsheet',
    changeType: 'spreadsheet',
    eventPrefix: 'sheet-ai',
    fileExtensions: ['.xlsx', '.xls', '.csv']
  }), [sheetName]);

  const payload = useMemo(() => ({
    action: action || 'Spreadsheet edits',
    sheetName: config.displayName,
    operations: operations || [],
    csvContent,
    note
  }), [action, config.displayName, operations, csvContent, note]);

  return (
    <AIToolCard
      config={config}
      args={payload}
      hasContent={hasContent}
    />
  );
};

export default SheetAITool;


