"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "../../utils"
import { Button } from "./button"

const CarouselContext = React.createContext<{
  totalItems: number
  scrollPrev: () => void
  scrollNext: () => void
  canScrollPrev: boolean
  canScrollNext: boolean
} | null>(null)

const useCarousel = () => {
  const context = React.useContext(CarouselContext)

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />")
  }

  return context
}

const Carousel = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    orientation?: "horizontal" | "vertical"
    autoScroll?: boolean
    scrollSpeed?: number
  }
>(({ className, orientation = "horizontal", autoScroll = true, scrollSpeed = 0.5, ...props }, ref) => {
  const [totalItems, setTotalItems] = React.useState(0)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const animationRef = React.useRef<number | null>(null)
  const scrollPositionRef = React.useRef(0)

  const scrollPrev = React.useCallback(() => {
    if (contentRef.current) {
      const itemWidth = contentRef.current.children[0]?.clientWidth || 0
      scrollPositionRef.current = Math.max(0, scrollPositionRef.current - itemWidth)
      contentRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`
    }
  }, [])

  const scrollNext = React.useCallback(() => {
    if (contentRef.current) {
      const itemWidth = contentRef.current.children[0]?.clientWidth || 0
      const maxScroll = (totalItems - 1) * itemWidth
      scrollPositionRef.current = Math.min(maxScroll, scrollPositionRef.current + itemWidth)
      contentRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`
    }
  }, [totalItems])

  React.useEffect(() => {
    if (contentRef.current) {
      const items = contentRef.current.children
      setTotalItems(items.length)
    }
  }, [])

  // Continuous scroll animation
  React.useEffect(() => {
    if (autoScroll && totalItems > 1 && contentRef.current) {
      const animate = () => {
        if (contentRef.current) {
          const itemWidth = contentRef.current.children[0]?.clientWidth || 0
          const containerWidth = contentRef.current.parentElement?.clientWidth || 0
          const totalWidth = totalItems * itemWidth
          
          // Only scroll if content overflows container
          if (totalWidth > containerWidth) {
            scrollPositionRef.current += scrollSpeed
            
            // Reset position when we've scrolled past visible content
            if (scrollPositionRef.current >= totalWidth - containerWidth) {
              scrollPositionRef.current = 0
            }
            
            contentRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`
          }
        }
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
      
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }
  }, [autoScroll, totalItems, scrollSpeed])

  // Pause auto scroll on hover
  const handleMouseEnter = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }
  }

  const handleMouseLeave = () => {
    if (autoScroll && totalItems > 1) {
      const animate = () => {
        if (contentRef.current) {
          const itemWidth = contentRef.current.children[0]?.clientWidth || 0
          const containerWidth = contentRef.current.parentElement?.clientWidth || 0
          const totalWidth = totalItems * itemWidth
          
          if (totalWidth > containerWidth) {
            scrollPositionRef.current += scrollSpeed
            
            if (scrollPositionRef.current >= totalWidth - containerWidth) {
              scrollPositionRef.current = 0
            }
            
            contentRef.current.style.transform = `translateX(-${scrollPositionRef.current}px)`
          }
        }
        
        animationRef.current = requestAnimationFrame(animate)
      }
      
      animationRef.current = requestAnimationFrame(animate)
    }
  }

  const canScrollPrev = scrollPositionRef.current > 0
  const canScrollNext = scrollPositionRef.current < (totalItems - 1) * (contentRef.current?.children[0]?.clientWidth || 0)

  return (
    <CarouselContext.Provider
      value={{
        totalItems,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
      }}
    >
      <div
        ref={ref}
        className={cn("relative overflow-hidden", className)}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        {...props}
      >
        <div
          ref={contentRef}
          className="flex transition-transform duration-300 ease-in-out"
        >
          {props.children}
        </div>
      </div>
    </CarouselContext.Provider>
  )
})
Carousel.displayName = "Carousel"

const CarouselContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex", className)}
    {...props}
  />
))
CarouselContent.displayName = "CarouselContent"

const CarouselItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("min-w-0 shrink-0 grow-0 basis-full", className)}
    {...props}
  />
))
CarouselItem.displayName = "CarouselItem"

const CarouselPrevious = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollPrev, canScrollPrev } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      {...props}
    >
      <ChevronLeft className="h-4 w-4" />
      <span className="sr-only">Previous slide</span>
    </Button>
  )
})
CarouselPrevious.displayName = "CarouselPrevious"

const CarouselNext = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, variant = "outline", size = "icon", ...props }, ref) => {
  const { scrollNext, canScrollNext } = useCarousel()

  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={cn("absolute h-8 w-8 rounded-full", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      {...props}
    >
      <ChevronRight className="h-4 w-4" />
      <span className="sr-only">Next slide</span>
    </Button>
  )
})
CarouselNext.displayName = "CarouselNext"

export {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
}
