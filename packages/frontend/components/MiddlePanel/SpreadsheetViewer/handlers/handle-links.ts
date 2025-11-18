interface LinkHandlerParams {
  hotTableRef: React.RefObject<any>;
  cellLinks: { [key: string]: string };
  setCellLinks: (links: React.SetStateAction<{ [key: string]: string }>) => void;
  setHasChanges: (hasChanges: boolean) => void;
  lastSelectionRef: React.RefObject<[number, number, number, number] | null>;
}

function createLinkHandlers({
  hotTableRef,
  cellLinks,
  setCellLinks,
  setHasChanges,
  lastSelectionRef
}: LinkHandlerParams) {
  
  const getSelection = (hotInstance: any) => {
    let sel = hotInstance.getSelected();
    if (!sel || sel.length === 0) {
      if (lastSelectionRef.current) {
        const [r, c, r2, c2] = lastSelectionRef.current;
        sel = [[r, c, r2, c2]] as any;
      } else {
        return null;
      }
    }
    return sel[0] as [number, number, number, number];
  };

  const setLink = (url: string) => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const selection = getSelection(hotInstance);
    if (!selection) return;
    
    const [startRow, startCol, endRow, endCol] = selection;
    
    // Normalize URL - add protocol if missing
    let normalizedUrl = url.trim();
    if (normalizedUrl && !normalizedUrl.match(/^https?:\/\//i)) {
      normalizedUrl = `https://${normalizedUrl}`;
    }
    
    hotInstance.batch(() => {
      setCellLinks(prevLinks => {
        const nextLinks = { ...prevLinks };
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const key = `${row}-${col}`;
            if (normalizedUrl) {
              nextLinks[key] = normalizedUrl;
            } else {
              delete nextLinks[key];
            }
          }
        }
        return nextLinks;
      });
      
      setHasChanges(true);
    });
  };

  const removeLink = () => {
    const hotInstance = hotTableRef.current?.hotInstance;
    if (!hotInstance) return;
    
    const selection = getSelection(hotInstance);
    if (!selection) return;
    
    const [startRow, startCol, endRow, endCol] = selection;
    
    hotInstance.batch(() => {
      setCellLinks(prevLinks => {
        const nextLinks = { ...prevLinks };
        for (let row = startRow; row <= endRow; row++) {
          for (let col = startCol; col <= endCol; col++) {
            const key = `${row}-${col}`;
            delete nextLinks[key];
          }
        }
        return nextLinks;
      });
      
      setHasChanges(true);
    });
  };

  const getLinkForCell = (row: number, col: number): string | null => {
    const key = `${row}-${col}`;
    return cellLinks[key] || null;
  };

  return {
    setLink,
    removeLink,
    getLinkForCell
  };
}

export { createLinkHandlers };
export type { LinkHandlerParams };

