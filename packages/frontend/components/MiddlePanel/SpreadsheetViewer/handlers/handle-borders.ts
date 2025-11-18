interface BorderHandlerParams {
  hotTableRef: React.RefObject<any>;
  cellStyles: { [key: string]: React.CSSProperties };
  setCellStyles: (styles: { [key: string]: React.CSSProperties }) => void;
  setHasChanges: (hasChanges: boolean) => void;
  lastSelectionRef: React.RefObject<[number, number, number, number] | null>;
  borderStyle: 'thin' | 'thick' | 'dashed';
  setCustomBordersDefs: (defs: any[]) => void;
  onContentChange?: (data: any[][]) => void;
}

type BorderOption = 'all' | 'outer' | 'inner' | 'top' | 'right' | 'bottom' | 'left' | 'thick-outer' | 'dashed-outer' | 'none';

function createBorderHandlers({
  hotTableRef,
  cellStyles,
  setCellStyles,
  setHasChanges,
  lastSelectionRef,
  borderStyle,
  setCustomBordersDefs,
  onContentChange
}: BorderHandlerParams) {

  const applyBordersOption = (option: BorderOption) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    // Use last selection if click caused selection to clear
    let sel = hotInstance.getSelected();
    if (!sel || sel.length === 0) {
      if (lastSelectionRef.current) {
        const [r, c, r2, c2] = lastSelectionRef.current;
        sel = [[r, c, r2, c2]] as any;
      } else {
        return;
      }
    }

    const [startRow, startCol, endRow, endCol] = sel[0] as [number, number, number, number];

    const nextStyles: {[key: string]: React.CSSProperties} = { ...cellStyles };
    const clearBorderKeys = (style: Record<string, any>) => {
      const { border, borderTop, borderRight, borderBottom, borderLeft, ...rest } = style || {};
      return rest;
    };

    const setEdge = (row: number, col: number, edges: Partial<Record<'top'|'right'|'bottom'|'left', string>>) => {
      const key = `${row}-${col}`;
      const current = (nextStyles[key] || {}) as any;
      const base = clearBorderKeys(current);
      const next: Record<string, any> = { ...base };
      if (edges.top) next.borderTop = edges.top;
      if (edges.right) next.borderRight = edges.right;
      if (edges.bottom) next.borderBottom = edges.bottom;
      if (edges.left) next.borderLeft = edges.left;
      nextStyles[key] = next as React.CSSProperties;
    };

    const styleFor = (kind: 'thin' | 'thick' | 'dashed') => {
      if (kind === 'thick') return '2px solid #000';
      if (kind === 'dashed') return '1px dashed #000';
      return '1px solid #000';
    };

    // Build CustomBorders plugin config based on selection
    const width = borderStyle === 'thick' ? 2 : 1; // dashed maps to thin (plugin doesn't support dashed style)
    const color = '#000';

    const defs: any[] = [];

    const pushOuterRange = () => {
      defs.push({
        range: {
          from: { row: startRow, col: startCol },
          to: { row: endRow, col: endCol },
        },
        top: { width, color },
        bottom: { width, color },
        start: { width, color },
        end: { width, color },
      });
    };

    const pushPerCell = (r: number, c: number, edges: Partial<Record<'top'|'right'|'bottom'|'left', boolean>>) => {
      const entry: any = { row: r, col: c };
      if (edges.top) entry.top = { width, color };
      if (edges.right) entry.right = { width, color };
      if (edges.bottom) entry.bottom = { width, color };
      if (edges.left) entry.left = { width, color };
      defs.push(entry);
    };

    switch (option) {
      case 'all': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            pushPerCell(r, c, { top: true, right: true, bottom: true, left: true });
            setEdge(r, c, { top: value, right: value, bottom: value, left: value });
          }
        }
        break;
      }
      case 'outer': {
        const value = styleFor(borderStyle);
        pushOuterRange();
        for (let c = startCol; c <= endCol; c++) {
          setEdge(startRow, c, { top: value });
          setEdge(endRow, c, { bottom: value });
        }
        for (let r = startRow; r <= endRow; r++) {
          setEdge(r, startCol, { left: value });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'thick-outer': {
        const value = styleFor('thick');
        defs.push({
          range: { from: { row: startRow, col: startCol }, to: { row: endRow, col: endCol } },
          top: { width: 2, color },
          bottom: { width: 2, color },
          start: { width: 2, color },
          end: { width: 2, color },
        });
        for (let c = startCol; c <= endCol; c++) {
          setEdge(startRow, c, { top: value });
          setEdge(endRow, c, { bottom: value });
        }
        for (let r = startRow; r <= endRow; r++) {
          setEdge(r, startCol, { left: value });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'dashed-outer': {
        // Fallback to thin since plugin doesn't support dashed. Could emulate via CSS if needed.
        pushOuterRange();
        const value = styleFor('dashed');
        for (let c = startCol; c <= endCol; c++) {
          setEdge(startRow, c, { top: value });
          setEdge(endRow, c, { bottom: value });
        }
        for (let r = startRow; r <= endRow; r++) {
          setEdge(r, startCol, { left: value });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'inner': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const edges: any = {};
            if (r > startRow) edges.top = true;
            if (c > startCol) edges.left = true;
            if (Object.keys(edges).length) pushPerCell(r, c, edges);
            const cssEdges: any = {};
            if (r > startRow) cssEdges.top = value;
            if (c > startCol) cssEdges.left = value;
            if (Object.keys(cssEdges).length) setEdge(r, c, cssEdges);
          }
        }
        break;
      }
      case 'top': {
        const value = styleFor(borderStyle);
        for (let c = startCol; c <= endCol; c++) {
          pushPerCell(startRow, c, { top: true });
          setEdge(startRow, c, { top: value });
        }
        break;
      }
      case 'bottom': {
        const value = styleFor(borderStyle);
        for (let c = startCol; c <= endCol; c++) {
          pushPerCell(endRow, c, { bottom: true });
          setEdge(endRow, c, { bottom: value });
        }
        break;
      }
      case 'left': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          pushPerCell(r, startCol, { left: true });
          setEdge(r, startCol, { left: value });
        }
        break;
      }
      case 'right': {
        const value = styleFor(borderStyle);
        for (let r = startRow; r <= endRow; r++) {
          pushPerCell(r, endCol, { right: true });
          setEdge(r, endCol, { right: value });
        }
        break;
      }
      case 'none':
        setCustomBordersDefs([]);
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            const key = `${r}-${c}`;
            const current = { ...(nextStyles[key] || {}) } as any;
            delete current.borderTop; delete current.borderRight; delete current.borderBottom; delete current.borderLeft; delete current.border;
            if (Object.keys(current).length) nextStyles[key] = current; else delete nextStyles[key];
          }
        }
        setCellStyles(nextStyles);
        hotInstance.render();
        setHasChanges(true);
        // Don't call onContentChange for border updates to prevent unnecessary re-renders
        return;
    }

    setCustomBordersDefs(defs);
    setCellStyles(nextStyles);
    hotInstance.render();
    setHasChanges(true);
    // Don't call onContentChange for border updates to prevent unnecessary re-renders
  };

  return {
    applyBordersOption
  };
}

export { createBorderHandlers };
export type { BorderHandlerParams, BorderOption };
