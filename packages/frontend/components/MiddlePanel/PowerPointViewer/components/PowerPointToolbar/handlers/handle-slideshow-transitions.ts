import { TransitionType } from '../../../types/slide-layouts'
import { CSSProperties } from 'react'

/**
 * Get CSS transition styles for a given transition type
 * @param transitionType - The type of transition to apply
 * @param isEntering - Whether the slide is entering (true) or exiting (false)
 * @param direction - The direction of navigation (forward or backward)
 * @returns CSS properties object with transition styles
 */
export function getTransitionStyle(
  transitionType: TransitionType,
  isEntering: boolean,
  direction: 'forward' | 'backward'
): CSSProperties {
  switch (transitionType) {
    case 'fade':
      return {
        opacity: isEntering ? 1 : 0,
        transition: 'opacity 300ms ease-in-out',
      }

    case 'slide':
    case 'slide-right':
      const slideRightX = isEntering ? 0 : (direction === 'forward' ? -100 : 100)
      return {
        transform: `translateX(${slideRightX}%)`,
        transition: 'transform 400ms ease-out',
      }

    case 'slide-left':
      const slideLeftX = isEntering ? 0 : (direction === 'forward' ? 100 : -100)
      return {
        transform: `translateX(${slideLeftX}%)`,
        transition: 'transform 400ms ease-out',
      }

    case 'slide-up':
      const slideUpY = isEntering ? 0 : (direction === 'forward' ? -100 : 100)
      return {
        transform: `translateY(${slideUpY}%)`,
        transition: 'transform 400ms ease-out',
      }

    case 'slide-down':
      const slideDownY = isEntering ? 0 : (direction === 'forward' ? 100 : -100)
      return {
        transform: `translateY(${slideDownY}%)`,
        transition: 'transform 400ms ease-out',
      }

    case 'zoom':
      return {
        transform: isEntering ? 'scale(1)' : 'scale(0.8)',
        opacity: isEntering ? 1 : 0,
        transition: 'transform 400ms ease-out, opacity 400ms ease-out',
      }

    case 'dissolve':
      return {
        opacity: isEntering ? 1 : 0,
        transform: isEntering ? 'scale(1)' : 'scale(0.95)',
        transition: 'opacity 500ms ease-in-out, transform 500ms ease-in-out',
      }

    case 'none':
    default:
      return {}
  }
}

/**
 * Get the duration (in milliseconds) for a given transition type
 * @param transitionType - The type of transition
 * @returns Duration in milliseconds
 */
export function getTransitionDuration(transitionType: TransitionType): number {
  switch (transitionType) {
    case 'fade':
      return 300
    case 'slide':
    case 'slide-right':
    case 'slide-left':
    case 'slide-up':
    case 'slide-down':
    case 'zoom':
      return 400
    case 'dissolve':
      return 500
    case 'none':
    default:
      return 0
  }
}
