/**
 * Handler for Tldraw AI tool responses
 * This handles the structured canvas operations returned by the tldraw_ai tool
 */

import { toRichText } from 'tldraw';

interface TldrawOperation {
  type: 'createShape' | 'updateShape' | 'deleteShape' | 'moveShape' | 'addText' | 'connectShapes' | 'groupShapes' | 'ungroupShapes' | 'duplicateShape' | 'setCanvasBackground' | 'addAnnotation';
  [key: string]: any;
}

interface TldrawAIResponse {
  action: string;
  canvasName?: string;
  operations?: TldrawOperation[];
  canvasData?: any;
  note?: string;
}

// Global reference to current tldraw editor from TldrawContext
let currentTldrawEditor: any = null;

// Function to be called by TldrawContext to register the current editor
export function setCurrentTldrawEditor(editor: any) {
  currentTldrawEditor = editor;
  console.log('Current Tldraw editor updated:', !!editor);
}

export async function handleTldrawAIResponse(payload: TldrawAIResponse) {
  console.log('Handling Tldraw AI response:', payload);
  console.log('Payload details:', {
    hasCanvasData: !!payload.canvasData,
    operationsCount: payload.operations?.length || 0,
    action: payload.action,
    canvasName: payload.canvasName
  });
  
  // Try to get the current tldraw file from attached files
  let currentTldrawFile = null;
  try {
    const attachedFiles = JSON.parse(localStorage.getItem('pendingAttachments') || '[]');
    currentTldrawFile = attachedFiles.find((file: any) => 
      file.fileName && file.fileName.toLowerCase().endsWith('.tldraw')
    );
    console.log('Found attached tldraw file:', currentTldrawFile);
  } catch (error) {
    console.warn('Could not get attached tldraw file:', error);
  }
  
  // Find the active Tldraw editor instance
  let editorInstance = currentTldrawEditor;
  
  // Fallback to finding editor in DOM
  if (!editorInstance) {
    console.log('No editor from context, trying fallback methods...');
    editorInstance = findActiveTldrawEditor();
  }
  
  if (!editorInstance) {
    console.warn('No active Tldraw editor found');
    showErrorFeedback('No active canvas editor found. Please make sure you have a tldraw canvas open.');
    return;
  }
  
  console.log('Found Tldraw editor instance:', editorInstance);
  console.log('Available editor methods:', Object.getOwnPropertyNames(editorInstance).filter(name => typeof editorInstance[name] === 'function'));
  
  try {
    if (payload.canvasData) {
      // Replace entire canvas data if provided
      console.log('Applying full canvas data to Tldraw editor');
      applyCanvasDataToTldraw(editorInstance, payload.canvasData);
    } else if (payload.operations && payload.operations.length > 0) {
      // Apply individual operations using Tldraw API
      console.log('Applying individual operations to Tldraw editor');
      applyTldrawOperations(editorInstance, payload.operations);
    } else {
      console.warn('No valid canvas data or operations provided in payload');
      showErrorFeedback('No canvas changes to apply');
      return;
    }
    
    // Success feedback removed - changes are immediately visible in canvas
    
  } catch (error) {
    console.error('Error applying Tldraw operations:', error);
    showErrorFeedback('Failed to apply canvas changes');
  }
}

function findActiveTldrawEditor() {
  // Strategy 1: Check global registry
  if (typeof window !== 'undefined' && (window as any)._tldrawEditors) {
    const editors = (window as any)._tldrawEditors;
    // Return the most recently registered editor that's still active
    for (let i = editors.length - 1; i >= 0; i--) {
      const editor = editors[i];
      if (editor && typeof editor.createShape === 'function') {
        console.log('Found active registered tldraw editor');
        return editor;
      }
    }
  }
  
  // Strategy 2: Try to find editor through DOM elements
  const tldrawElements = document.querySelectorAll('[data-testid="canvas"], .tl-canvas, .tldraw');
  console.log(`Found ${tldrawElements.length} Tldraw elements in DOM`);
  
  for (let i = 0; i < tldrawElements.length; i++) {
    const element = tldrawElements[i] as HTMLElement;
    const editorInstance = getEditorFromTldrawElement(element);
    if (editorInstance) {
      console.log('Found tldraw editor instance from DOM element');
      return editorInstance;
    }
  }
  
  return null;
}

// Utility function to register tldraw editor instances globally
export function registerTldrawEditor(editor: any) {
  if (typeof window !== 'undefined') {
    if (!(window as any)._tldrawEditors) {
      (window as any)._tldrawEditors = [];
    }
    (window as any)._tldrawEditors.push(editor);
    
    // Keep only the last few editors to avoid memory leaks
    if ((window as any)._tldrawEditors.length > 5) {
      (window as any)._tldrawEditors = (window as any)._tldrawEditors.slice(-3);
    }
  }
}

// Utility function to unregister tldraw editor instances
export function unregisterTldrawEditor(editor: any) {
  if (typeof window !== 'undefined' && (window as any)._tldrawEditors) {
    (window as any)._tldrawEditors = (window as any)._tldrawEditors.filter(
      (e: any) => e !== editor
    );
  }
}

function getEditorFromTldrawElement(element: HTMLElement) {
  // Try different ways to get the tldraw editor instance from DOM element
  
  // Check for editor instance stored on the element itself
  if ((element as any).__tldrawEditor) {
    return (element as any).__tldrawEditor;
  }
  
  if ((element as any).editor) {
    return (element as any).editor;
  }
  
  // Check parent elements for React component instances with editor
  let current = element.parentElement;
  while (current) {
    const reactKeys = Object.keys(current).filter(key => key.startsWith('__react'));
    for (const key of reactKeys) {
      try {
        const reactInstance = (current as any)[key];
        if (reactInstance && reactInstance.memoizedProps && reactInstance.memoizedProps.editor) {
          return reactInstance.memoizedProps.editor;
        }
        if (reactInstance && reactInstance.stateNode && reactInstance.stateNode.editor) {
          return reactInstance.stateNode.editor;
        }
      } catch (e) {
        // Ignore errors when traversing React internals
      }
    }
    
    current = current.parentElement;
  }
  
  return null;
}

function applyCanvasDataToTldraw(editor: any, canvasData: any) {
  try {
    // If we have full canvas data, we can load it directly
    if (canvasData.records && Array.isArray(canvasData.records)) {
      // Clear existing content and load new data
      editor.store.clear();
      editor.store.put(canvasData.records);
    } else {
      console.warn('Invalid canvas data format');
    }
  } catch (error) {
    console.error('Error applying canvas data to Tldraw:', error);
    throw error;
  }
}

function applyTldrawOperations(editor: any, operations: TldrawOperation[]) {
  // Apply operations using Tldraw's API
  for (let i = 0; i < operations.length; i++) {
    const operation = operations[i];
    try {
      switch (operation.type) {
        case 'createShape':
          createShapeWithTldraw(editor, operation);
          break;
        case 'updateShape':
          updateShapeWithTldraw(editor, operation);
          break;
        case 'deleteShape':
          deleteShapeWithTldraw(editor, operation.shapeId);
          break;
        case 'moveShape':
          moveShapeWithTldraw(editor, operation.shapeId, operation.x, operation.y);
          break;
        case 'addText':
          addTextToShapeWithTldraw(editor, operation.shapeId, operation.text);
          break;
        case 'connectShapes':
          connectShapesWithTldraw(editor, operation.fromShapeId, operation.toShapeId, operation.arrowType);
          break;
        case 'groupShapes':
          groupShapesWithTldraw(editor, operation.shapeIds, operation.groupName);
          break;
        case 'ungroupShapes':
          ungroupShapesWithTldraw(editor, operation.groupId);
          break;
        case 'duplicateShape':
          duplicateShapeWithTldraw(editor, operation.shapeId, operation.offsetX, operation.offsetY);
          break;
        case 'setCanvasBackground':
          setCanvasBackgroundWithTldraw(editor, operation.color, operation.pattern);
          break;
        case 'addAnnotation':
          addAnnotationWithTldraw(editor, operation.x, operation.y, operation.text, operation.type);
          break;
        default:
          console.warn('Unknown tldraw operation type:', operation.type);
      }
    } catch (error) {
      console.error(`Error applying Tldraw operation ${operation.type}:`, error);
    }
  }
}

// Function to map hex colors to valid tldraw color names
function mapHexColorToTldrawColor(hexColor: string): string {
  if (!hexColor) return 'black';
  
  // If it's already a valid tldraw color name, return it
  const validColors = ['black', 'grey', 'light-violet', 'violet', 'blue', 'light-blue', 'yellow', 'orange', 'green', 'light-green', 'light-red', 'red', 'white'];
  if (validColors.includes(hexColor.toLowerCase())) {
    return hexColor.toLowerCase();
  }
  
  // Convert hex to closest tldraw color
  if (hexColor.startsWith('#')) {
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Simple color mapping based on RGB values
    if (r < 50 && g < 50 && b < 50) return 'black';
    if (r > 200 && g > 200 && b > 200) return 'white';
    if (r > g && r > b && r > 150) return 'red';
    if (g > r && g > b && g > 150) return 'green';
    if (b > r && b > g && b > 150) return 'blue';
    if (r > 150 && g > 100 && b < 100) return 'orange';
    if (r > 150 && g > 150 && b < 100) return 'yellow';
    if (r > 100 && g < 100 && b > 100) return 'violet';
    if (r > 100 && g > 100 && b > 100) return 'grey';
    
    // Default fallback
    return 'black';
  }
  
  return 'black';
}

// Tldraw-specific operation functions using the proper API
function createShapeWithTldraw(editor: any, operation: any) {
  const { shapeType, x, y, width = 100, height = 100, text = '', color = 'black', note = '' } = operation;
  
  // Map the color to a valid tldraw color name
  const validColor = mapHexColorToTldrawColor(color);
  
  // Ensure positive dimensions for geo shapes
  const validWidth = Math.max(width || 100, 10);
  const validHeight = Math.max(height || 100, 10);
  const validX = x || 0;
  const validY = y || 0;
  
  try {
    // Generate a unique ID for the shape
    const shapeId = `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let shapeData: any;
    
    // Use a simpler approach - create basic shapes that are more likely to validate
    switch (shapeType) {
      case 'rectangle':
        shapeData = {
          id: shapeId,
          type: 'geo',
          x: validX,
          y: validY,
          props: {
            w: validWidth,
            h: validHeight,
            geo: 'rectangle',
            color: validColor,
            fill: 'none',
            dash: 'draw',
            size: 'm',
            font: 'draw',
            align: 'middle',
            verticalAlign: 'middle',
            growY: 0,
            url: '',
            text: text || ''
          }
        };
        break;
      case 'ellipse':
        shapeData = {
          id: shapeId,
          type: 'geo',
          x: validX,
          y: validY,
          props: {
            w: validWidth,
            h: validHeight,
            geo: 'ellipse',
            color: validColor,
            fill: 'none',
            dash: 'draw',
            size: 'm',
            font: 'draw',
            align: 'middle',
            verticalAlign: 'middle',
            growY: 0,
            url: '',
            text: text || ''
          }
        };
        break;
      case 'text':
        // Create a text shape exactly like athena-intelligence does
        shapeData = {
          id: shapeId,
          type: 'text',
          x: validX,
          y: validY,
          props: {
            text: text || 'Text',
            color: validColor,
            textAlign: 'middle'
          }
        };
        break;
      case 'note':
        shapeData = {
          id: shapeId,
          type: 'note',
          x: validX,
          y: validY,
          props: {
            color: validColor,
            text: text || 'Note'
          }
        };
        break;
      default:
        // Default to a simple rectangle
        shapeData = {
          id: shapeId,
          type: 'geo',
          x: validX,
          y: validY,
          props: {
            w: validWidth,
            h: validHeight,
            geo: 'rectangle',
            color: validColor,
            fill: 'none',
            dash: 'draw',
            size: 'm',
            font: 'draw',
            align: 'middle',
            verticalAlign: 'middle',
            growY: 0,
            url: '',
            text: text || ''
          }
        };
    }
    
    // Add metadata if note is provided
    if (note) {
      shapeData.meta = { description: note };
    }
    
    console.log('Creating shape with data:', shapeData);
    
    // Create the main shape first
    if (typeof editor.createShape === 'function') {
      editor.createShape(shapeData);
    } else if (typeof editor.createShapes === 'function') {
      editor.createShapes([shapeData]);
    } else if (editor.store && typeof editor.store.put === 'function') {
      editor.store.put([shapeData]);
    } else {
      console.error('No available method to create shape on editor:', editor);
      throw new Error('Editor does not have createShape, createShapes, or store.put methods');
    }
    
    // If text was requested and this is a geo shape (not text), create a separate text element on top
    if (text && text.trim() && (shapeType === 'rectangle' || shapeType === 'ellipse')) {
      try {
        const textShapeId = `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const textShapeData = {
          id: textShapeId,
          type: 'text',
          x: validX + validWidth / 4,
          y: validY + validHeight / 4,
          props: {
            text: text,
            color: validColor,
            textAlign: 'middle'
          }
        };
        
        console.log('Creating text overlay with data:', textShapeData);
        
        if (typeof editor.createShape === 'function') {
          editor.createShape(textShapeData);
        } else if (typeof editor.createShapes === 'function') {
          editor.createShapes([textShapeData]);
        } else if (editor.store && typeof editor.store.put === 'function') {
          editor.store.put([textShapeData]);
        }
      } catch (textError) {
        console.warn('Could not create text overlay:', textError);
      }
    }
  } catch (error) {
    console.error('Error in createShapeWithTldraw:', error);
    throw error;
  }
}

function updateShapeWithTldraw(editor: any, operation: any) {
  const { shapeId, x, y, width, height, text, color, note } = operation;
  
  try {
    const updates: any = { id: shapeId };
    if (x !== undefined) updates.x = x;
    if (y !== undefined) updates.y = y;
    if (width !== undefined) updates['props.w'] = width;
    if (height !== undefined) updates['props.h'] = height;
    if (text !== undefined) updates['props.text'] = text;
    if (color !== undefined) updates['props.color'] = mapHexColorToTldrawColor(color);
    if (note !== undefined) updates['meta.description'] = note;
    
    console.log('Updating shape with data:', updates);
    
    if (typeof editor.updateShape === 'function') {
      editor.updateShape(updates);
    } else if (typeof editor.updateShapes === 'function') {
      editor.updateShapes([updates]);
    } else if (editor.store && typeof editor.store.update === 'function') {
      editor.store.update(shapeId, (shape: any) => ({ ...shape, ...updates }));
    } else {
      console.error('No available method to update shape on editor:', editor);
      throw new Error('Editor does not have updateShape, updateShapes, or store.update methods');
    }
  } catch (error) {
    console.error('Error in updateShapeWithTldraw:', error);
    throw error;
  }
}

function deleteShapeWithTldraw(editor: any, shapeId: string) {
  try {
    console.log('Deleting shape:', shapeId);
    
    if (typeof editor.deleteShape === 'function') {
      editor.deleteShape(shapeId);
    } else if (typeof editor.deleteShapes === 'function') {
      editor.deleteShapes([shapeId]);
    } else if (editor.store && typeof editor.store.remove === 'function') {
      editor.store.remove([shapeId]);
    } else {
      console.error('No available method to delete shape on editor:', editor);
      throw new Error('Editor does not have deleteShape, deleteShapes, or store.remove methods');
    }
  } catch (error) {
    console.error('Error in deleteShapeWithTldraw:', error);
    throw error;
  }
}

function moveShapeWithTldraw(editor: any, shapeId: string, x: number, y: number) {
  updateShapeWithTldraw(editor, { shapeId, x, y });
}

function addTextToShapeWithTldraw(editor: any, shapeId: string, text: string) {
  updateShapeWithTldraw(editor, { shapeId, text });
}

function connectShapesWithTldraw(editor: any, fromShapeId: string, toShapeId: string, arrowType = 'arrow') {
  try {
    const arrowId = `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create an arrow shape with proper structure
    const arrowData = {
      id: arrowId,
      type: 'arrow',
      x: 100,
      y: 100,
      props: {
        start: { x: 0, y: 0 },
        end: { x: 200, y: 200 },
        arrowheadStart: 'none',
        arrowheadEnd: 'arrow',
        color: 'black',
        size: 'm',
        fill: 'none'
      }
    };
    
    console.log('Creating arrow connection:', arrowData);
    
    if (typeof editor.createShape === 'function') {
      editor.createShape(arrowData);
    } else if (typeof editor.createShapes === 'function') {
      editor.createShapes([arrowData]);
    } else if (editor.store && typeof editor.store.put === 'function') {
      editor.store.put([arrowData]);
    } else {
      console.error('No available method to create arrow on editor:', editor);
      throw new Error('Editor does not have shape creation methods');
    }
  } catch (error) {
    console.error('Error in connectShapesWithTldraw:', error);
    throw error;
  }
}

function groupShapesWithTldraw(editor: any, shapeIds: string[], groupName?: string) {
  try {
    console.log('Grouping shapes:', shapeIds);
    
    if (typeof editor.groupShapes === 'function') {
      editor.groupShapes(shapeIds);
    } else {
      console.warn('groupShapes not available on editor, skipping group operation');
    }
  } catch (error) {
    console.error('Error in groupShapesWithTldraw:', error);
    throw error;
  }
}

function ungroupShapesWithTldraw(editor: any, groupId: string) {
  try {
    console.log('Ungrouping shapes:', groupId);
    
    if (typeof editor.ungroupShapes === 'function') {
      editor.ungroupShapes([groupId]);
    } else {
      console.warn('ungroupShapes not available on editor, skipping ungroup operation');
    }
  } catch (error) {
    console.error('Error in ungroupShapesWithTldraw:', error);
    throw error;
  }
}

function duplicateShapeWithTldraw(editor: any, shapeId: string, offsetX = 20, offsetY = 20) {
  try {
    console.log('Duplicating shape:', shapeId);
    
    let shape = null;
    if (typeof editor.getShape === 'function') {
      shape = editor.getShape(shapeId);
    } else if (editor.store && typeof editor.store.get === 'function') {
      shape = editor.store.get(shapeId);
    }
    
    if (shape) {
      const newShapeId = `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const duplicatedShape = {
        ...shape,
        id: newShapeId,
        x: shape.x + offsetX,
        y: shape.y + offsetY
      };
      
      if (typeof editor.createShape === 'function') {
        editor.createShape(duplicatedShape);
      } else if (typeof editor.createShapes === 'function') {
        editor.createShapes([duplicatedShape]);
      } else if (editor.store && typeof editor.store.put === 'function') {
        editor.store.put([duplicatedShape]);
      }
    } else {
      console.warn('Could not find shape to duplicate:', shapeId);
    }
  } catch (error) {
    console.error('Error in duplicateShapeWithTldraw:', error);
    throw error;
  }
}

function setCanvasBackgroundWithTldraw(editor: any, color?: string, pattern?: string) {
  try {
    console.log('Setting canvas background:', { color, pattern });
    
    // Tldraw doesn't have a direct background setting, but we can create a large background rectangle
    if (color) {
      const backgroundId = `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Get viewport bounds if available
      let viewport = { x: -1000, y: -1000, w: 2000, h: 2000 };
      try {
        if (typeof editor.getViewportPageBounds === 'function') {
          const bounds = editor.getViewportPageBounds();
          viewport = {
            x: bounds.x - 1000,
            y: bounds.y - 1000,
            w: bounds.w + 2000,
            h: bounds.h + 2000
          };
        }
      } catch (e) {
        console.warn('Could not get viewport bounds, using default');
      }
      
      const backgroundData = {
        id: backgroundId,
        type: 'geo',
        x: viewport.x,
        y: viewport.y,
        props: {
          w: viewport.w,
          h: viewport.h,
          geo: 'rectangle',
          color: mapHexColorToTldrawColor(color),
          fill: 'solid',
          dash: 'draw',
          size: 'm',
          font: 'draw',
          align: 'middle',
          verticalAlign: 'middle',
          growY: 0,
          url: ''
        }
      };
      
      if (typeof editor.createShape === 'function') {
        editor.createShape(backgroundData);
      } else if (typeof editor.createShapes === 'function') {
        editor.createShapes([backgroundData]);
      } else if (editor.store && typeof editor.store.put === 'function') {
        editor.store.put([backgroundData]);
      }
      
      // Send to back if method is available
      try {
        if (typeof editor.sendToBack === 'function') {
          editor.sendToBack([backgroundId]);
        }
      } catch (e) {
        console.warn('Could not send background to back:', e);
      }
    }
  } catch (error) {
    console.error('Error in setCanvasBackgroundWithTldraw:', error);
    throw error;
  }
}

function addAnnotationWithTldraw(editor: any, x: number, y: number, text: string, type = 'comment') {
  try {
    console.log('Adding annotation:', { x, y, text, type });
    
    const annotationId = `shape:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    let annotationData: any;
    
    if (type === 'highlight') {
      // Create a highlighted rectangle
      annotationData = {
        id: annotationId,
        type: 'geo',
        x: x - 10,
        y: y - 10,
        props: {
          w: text.length * 8 + 20,
          h: 30,
          geo: 'rectangle',
          color: 'yellow',
          fill: 'semi',
          dash: 'draw',
          size: 'm',
          font: 'draw',
          align: 'middle',
          verticalAlign: 'middle',
          growY: 0,
          url: ''
        }
      };
    } else {
      // Create a note/comment
      annotationData = {
        id: annotationId,
        type: 'note',
        x,
        y,
        props: {
          color: 'orange',
          size: 's',
          font: 'draw'
        }
      };
    }
    
    if (typeof editor.createShape === 'function') {
      editor.createShape(annotationData);
    } else if (typeof editor.createShapes === 'function') {
      editor.createShapes([annotationData]);
    } else if (editor.store && typeof editor.store.put === 'function') {
      editor.store.put([annotationData]);
    } else {
      console.error('No available method to create annotation on editor:', editor);
      throw new Error('Editor does not have shape creation methods');
    }
  } catch (error) {
    console.error('Error in addAnnotationWithTldraw:', error);
    throw error;
  }
}

function showSuccessFeedback(action: string) {
  // Create a temporary success message
  const feedback = document.createElement('div');
  feedback.textContent = `✓ ${action} applied successfully`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

function showErrorFeedback(message: string) {
  // Create a temporary error message
  const feedback = document.createElement('div');
  feedback.textContent = `✗ ${message}`;
  feedback.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #ef4444;
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    z-index: 9999;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  `;
  
  document.body.appendChild(feedback);
  
  setTimeout(() => {
    feedback.remove();
  }, 3000);
}

// Note: This function is available but not used for auto-save to avoid unnecessary uploads
// The user can manually save using the save button in the TldrawViewer
async function saveCanvasFile(editor: any, canvasName?: string, currentFile?: any) {
  try {
    console.log('Saving canvas file...');
    
    // Get the current canvas data from the editor
    const canvasData = {
      tldrawFileFormatVersion: 1,
      schema: editor.store.schema.serialize(),
      records: editor.store.allRecords()
    };
    
    // Determine filename and path from various sources
    let fileName = canvasName || 'modified-canvas.tldraw';
    let filePath = fileName;
    let fileId = null;
    
    // First priority: use the current attached file info
    if (currentFile) {
      fileName = currentFile.fileName || fileName;
      filePath = currentFile.filePath || fileName;
      fileId = currentFile.fileId;
      console.log('Using attached file info:', { fileName, filePath, fileId });
    } else {
      // Fallback: try to get the file info from the current workspace tab
      try {
        const activeTab = document.querySelector('[data-testid="tab"][aria-selected="true"]');
        if (activeTab) {
          const tabText = activeTab.textContent || '';
          if (tabText.endsWith('.tldraw')) {
            fileName = tabText;
            filePath = fileName;
            console.log('Using active tab info:', { fileName, filePath });
          }
        }
      } catch (error) {
        console.warn('Could not determine active tldraw file, using default name');
      }
    }
    
    // Convert canvas data to JSON blob
    const jsonContent = JSON.stringify(canvasData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const file = new File([blob], fileName, { type: 'application/json' });
    
    // Import ApiService dynamically to avoid circular dependencies
    const { ApiService } = await import('../../../../backend/api/apiService');
    
    // Upload the modified file to S3
    const uploadResult = await ApiService.uploadToS3(file, fileName, 'web-editor', filePath, '');
    
    if (uploadResult) {
      console.log('Canvas file saved successfully');
      
      // Dispatch event to refresh the file sidebar
      window.dispatchEvent(new CustomEvent('file-sidebar-refresh'));
      
      // Dispatch event to reopen the file with the new content
      window.dispatchEvent(new CustomEvent('workspace-reopen-file', {
        detail: {
          oldPath: filePath,
          newFile: {
            id: fileId || filePath,
            file_id: fileId || filePath,
            name: fileName,
            type: 'file',
            path: filePath,
          }
        }
      }));
      
      return true;
    } else {
      throw new Error('Upload failed');
    }
  } catch (error) {
    console.error('Error saving canvas file:', error);
    showErrorFeedback('Failed to save canvas changes to file');
    return false;
  }
}
