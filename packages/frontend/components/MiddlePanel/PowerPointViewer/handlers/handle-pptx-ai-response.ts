/**
 * Handler for PowerPoint AI tool responses
 * Implements idempotent preview/accept/reject with stable element IDs
 */

import type { Slide, SlideElement } from '../PowerPointViewer';

interface PptxOperation {
  type: 'createSlide' | 'deleteSlide' | 'reorderSlides' | 'addText' | 'addShape' | 'addImage' | 'updateElement' | 'deleteElement' | 'setSlideBackground' | 'applyTheme';
  slideIndex?: number;
  element?: Partial<SlideElement>;
  elementId?: string;
  layout?: string;
  background?: string;
  fromIndex?: number;
  toIndex?: number;
  theme?: string;
  [key: string]: any;
}

interface PptxAIResponse {
  action: string;
  presentationName?: string;
  operations?: PptxOperation[];
  slidesData?: Slide[];
  note?: string;
  preview?: boolean;
  changeId?: string;
}

interface ApplyResult {
  nextSlides: Slide[];
  nextCurrentSlideIndex: number;
}

// Global state for preview management
const originalSlidesByChangeId = new Map<string, { slides: Slide[]; currentSlideIndex: number }>();
const appliedPreviewChangeIds = new Set<string>();

// Generate unique IDs for slides and elements
function generateUniqueId(prefix: 'slide' | 'element'): string {
  // Prefer crypto.randomUUID if available
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  // Fallback to timestamp + random
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * Apply PowerPoint AI operations with preview/accept/reject support
 */
export function handlePptxAIResponse(
  payload: PptxAIResponse,
  currentSlides: Slide[],
  currentSlideIndex: number
): ApplyResult | null {
  const { operations, slidesData, preview = true, changeId } = payload;

  // If no changeId provided, generate one (shouldn't happen with updated AIToolCard)
  const effectiveChangeId = changeId || `fallback-${Date.now()}`;

  // PREVIEW mode: apply changes if not already previewed
  if (preview === true) {
    // Check if we've already previewed this changeId
    if (appliedPreviewChangeIds.has(effectiveChangeId)) {
      console.log(`[pptx-ai] Ignoring duplicate preview for changeId: ${effectiveChangeId}`);
      return null; // Idempotent: already previewed
    }

    // Snapshot current state for potential reject
    originalSlidesByChangeId.set(effectiveChangeId, {
      slides: JSON.parse(JSON.stringify(currentSlides)),
      currentSlideIndex
    });

    // Mark as previewed
    appliedPreviewChangeIds.add(effectiveChangeId);

    // Apply changes and return
    return applyChanges(slidesData, operations, currentSlides, currentSlideIndex);
  }

  // ACCEPT mode (preview: false): commit the preview
  if (preview === false) {
    // If we have a snapshot, this is a commit - just clean up state
    if (originalSlidesByChangeId.has(effectiveChangeId)) {
      originalSlidesByChangeId.delete(effectiveChangeId);
      appliedPreviewChangeIds.delete(effectiveChangeId);
      // Changes are already visible (preview applied them), so return null to indicate no-op
      return null;
    }

    // If no snapshot exists, this might be a direct apply without preview (shouldn't happen)
    // Apply changes anyway for safety
    return applyChanges(slidesData, operations, currentSlides, currentSlideIndex);
  }

  return null;
}

/**
 * Handle reject event - restore original slides
 */
export function handlePptxAIReject(
  changeId: string,
  currentSlides: Slide[],
  currentSlideIndex: number
): ApplyResult | null {
  const snapshot = originalSlidesByChangeId.get(changeId);
  
  if (!snapshot) {
    console.warn(`[pptx-ai] No snapshot found for changeId: ${changeId}`);
    return null;
  }

  // Clean up state
  originalSlidesByChangeId.delete(changeId);
  appliedPreviewChangeIds.delete(changeId);

  // Restore original slides
  return {
    nextSlides: snapshot.slides,
    nextCurrentSlideIndex: snapshot.currentSlideIndex
  };
}

/**
 * Apply changes (either slidesData or operations)
 */
function applyChanges(
  slidesData: Slide[] | undefined,
  operations: PptxOperation[] | undefined,
  currentSlides: Slide[],
  currentSlideIndex: number
): ApplyResult {
  // If full slides data is provided, replace everything
  if (slidesData && Array.isArray(slidesData)) {
    return {
      nextSlides: slidesData,
      nextCurrentSlideIndex: currentSlideIndex
    };
  }

  // Apply operations
  if (operations && Array.isArray(operations)) {
    return applyOperations(operations, currentSlides, currentSlideIndex);
  }

  // No changes
  return {
    nextSlides: currentSlides,
    nextCurrentSlideIndex: currentSlideIndex
  };
}

/**
 * Apply a list of operations to slides
 */
function applyOperations(
  operations: PptxOperation[],
  currentSlides: Slide[],
  currentSlideIndex: number
): ApplyResult {
  let newSlides = JSON.parse(JSON.stringify(currentSlides)) as Slide[];
  let newCurrentSlideIndex = currentSlideIndex;
  
  // Track the most recently created slide index within this tool call
  let lastCreatedSlideIndex: number | null = null;

  for (const op of operations) {
    switch (op.type) {
      case 'createSlide': {
        const newSlide: Slide = {
          id: generateUniqueId('slide'),
          index: newSlides.length,
          elements: [],
          layout: (op.layout as Slide['layout']) || 'blank',
          background: op.background,
        };
        const insertIndex = op.slideIndex ?? newSlides.length;
        newSlides.splice(insertIndex, 0, newSlide);
        // Update indices
        newSlides = newSlides.map((s, i) => ({ ...s, index: i }));
        // Track this as the last created slide
        lastCreatedSlideIndex = insertIndex;
        break;
      }

      case 'deleteSlide': {
        const deleteIndex = op.slideIndex ?? newSlides.length - 1;
        if (deleteIndex >= 0 && deleteIndex < newSlides.length && newSlides.length > 1) {
          newSlides.splice(deleteIndex, 1);
          newSlides = newSlides.map((s, i) => ({ ...s, index: i }));
          // Adjust current slide index if needed
          if (newCurrentSlideIndex >= newSlides.length) {
            newCurrentSlideIndex = Math.max(0, newSlides.length - 1);
          }
        }
        break;
      }

      case 'reorderSlides': {
        if (op.fromIndex !== undefined && op.toIndex !== undefined) {
          const [moved] = newSlides.splice(op.fromIndex, 1);
          newSlides.splice(op.toIndex, 0, moved);
          newSlides = newSlides.map((s, i) => ({ ...s, index: i }));
        }
        break;
      }

      case 'addText':
      case 'addShape':
      case 'addImage': {
        // Determine target slide index with smart defaults
        let slideIndex: number;
        if (op.slideIndex !== undefined) {
          // Explicit slideIndex provided
          slideIndex = op.slideIndex;
        } else if (lastCreatedSlideIndex !== null) {
          // If a slide was just created in this tool call, target it
          slideIndex = lastCreatedSlideIndex;
        } else {
          // Default to current slide
          slideIndex = newCurrentSlideIndex;
        }

        if (slideIndex >= 0 && slideIndex < newSlides.length && op.element) {
          const newElement: SlideElement = {
            id: generateUniqueId('element'),
            type: op.type === 'addText' ? 'text' : op.type === 'addShape' ? 'shape' : 'image',
            x: op.element.x ?? 10,
            y: op.element.y ?? 10,
            width: op.element.width ?? 80,
            height: op.element.height ?? 20,
            ...op.element,
          } as SlideElement;
          newSlides[slideIndex].elements.push(newElement);
        }
        break;
      }

      case 'updateElement': {
        const slideIndex = op.slideIndex ?? newCurrentSlideIndex;
        if (slideIndex >= 0 && slideIndex < newSlides.length && op.elementId) {
          const elementIndex = newSlides[slideIndex].elements.findIndex(e => e.id === op.elementId);
          if (elementIndex >= 0) {
            newSlides[slideIndex].elements[elementIndex] = {
              ...newSlides[slideIndex].elements[elementIndex],
              ...op.element,
            };
          }
        }
        break;
      }

      case 'deleteElement': {
        const slideIndex = op.slideIndex ?? newCurrentSlideIndex;
        if (slideIndex >= 0 && slideIndex < newSlides.length && op.elementId) {
          newSlides[slideIndex].elements = newSlides[slideIndex].elements.filter(
            e => e.id !== op.elementId
          );
        }
        break;
      }

      case 'setSlideBackground': {
        const slideIndex = op.slideIndex ?? newCurrentSlideIndex;
        if (slideIndex >= 0 && slideIndex < newSlides.length) {
          newSlides[slideIndex].background = op.background;
        }
        break;
      }

      case 'applyTheme': {
        // Theme application is a no-op for now (could be extended)
        break;
      }
    }
  }

  return {
    nextSlides: newSlides,
    nextCurrentSlideIndex: newCurrentSlideIndex
  };
}

