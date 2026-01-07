import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { Button } from '../../../ui/button'
import { cn } from '../../../../lib/utils'

interface SlideshowControlsProps {
  currentIndex: number
  totalSlides: number
  onNext: () => void
  onPrevious: () => void
  onExit: () => void
  canGoNext: boolean
  canGoPrevious: boolean
}

export function SlideshowControls({
  currentIndex,
  totalSlides,
  onNext,
  onPrevious,
  onExit,
  canGoNext,
  canGoPrevious,
}: SlideshowControlsProps) {
  return (
    <>
      {/* Left Navigation Area */}
      <div
        className={cn(
          'fixed left-0 top-0 bottom-0 w-[20%] flex items-center justify-start pl-8',
          'transition-opacity duration-200',
          canGoPrevious ? 'cursor-pointer' : 'cursor-not-allowed'
        )}
        onClick={canGoPrevious ? onPrevious : undefined}
      >
        {canGoPrevious && (
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-30 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onPrevious()
            }}
          >
            <ChevronLeft className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Right Navigation Area */}
      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 w-[20%] flex items-center justify-end pr-8',
          'transition-opacity duration-200',
          canGoNext ? 'cursor-pointer' : 'cursor-not-allowed'
        )}
        onClick={canGoNext ? onNext : undefined}
      >
        {canGoNext && (
          <Button
            variant="ghost"
            size="icon"
            className="w-16 h-16 rounded-full bg-black/60 hover:bg-black/80 text-white opacity-30 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onNext()
            }}
          >
            <ChevronRight className="w-8 h-8" />
          </Button>
        )}
      </div>

      {/* Progress Indicator */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
        {currentIndex + 1} / {totalSlides}
      </div>

      {/* Exit Button */}
      <Button
        variant="ghost"
        size="icon"
        className="fixed top-8 right-8 w-12 h-12 rounded-full bg-black/60 hover:bg-black/80 text-white"
        onClick={onExit}
      >
        <X className="w-6 h-6" />
      </Button>
    </>
  )
}
