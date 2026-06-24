import type { MouseEvent, MutableRefObject, RefObject } from 'react'

interface ImagePanHandlerOptions {
  viewerRef: RefObject<HTMLDivElement | null>
  isPanningRef: MutableRefObject<boolean>
  startXRef: MutableRefObject<number>
  startYRef: MutableRefObject<number>
  scrollLeftRef: MutableRefObject<number>
  scrollTopRef: MutableRefObject<number>
}

function hasScrollableOverflow(viewer: HTMLDivElement) {
  return viewer.scrollWidth > viewer.clientWidth || viewer.scrollHeight > viewer.clientHeight
}

export function createImagePanStartHandler({
  viewerRef,
  isPanningRef,
  startXRef,
  startYRef,
  scrollLeftRef,
  scrollTopRef,
}: ImagePanHandlerOptions) {
  return function handleImagePanStart(event: MouseEvent<HTMLDivElement>) {
    const viewer = viewerRef.current
    if (!viewer || event.button !== 0 || !hasScrollableOverflow(viewer)) return

    event.preventDefault()
    isPanningRef.current = true
    startXRef.current = event.clientX
    startYRef.current = event.clientY
    scrollLeftRef.current = viewer.scrollLeft
    scrollTopRef.current = viewer.scrollTop
  }
}

export function createImagePanMoveHandler({
  viewerRef,
  isPanningRef,
  startXRef,
  startYRef,
  scrollLeftRef,
  scrollTopRef,
}: ImagePanHandlerOptions) {
  return function handleImagePanMove(event: MouseEvent<HTMLDivElement>) {
    const viewer = viewerRef.current
    if (!viewer || !isPanningRef.current) return

    event.preventDefault()
    viewer.scrollLeft = scrollLeftRef.current - (event.clientX - startXRef.current)
    viewer.scrollTop = scrollTopRef.current - (event.clientY - startYRef.current)
  }
}

export function createImagePanStopHandler(isPanningRef: MutableRefObject<boolean>) {
  return function handleImagePanStop() {
    isPanningRef.current = false
  }
}
