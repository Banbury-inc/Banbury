import React from 'react'
import zoomLogo from '../../assets/images/zoom-fondo-blanco-vertical-seeklogo.png'

interface ZoomIconProps {
  size?: number | string
  className?: string
}

export function ZoomIcon({ className, size = 48 }: ZoomIconProps) {
  return (
    <img
      src={zoomLogo.src}
      alt="Zoom"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
