import React from 'react'
import googleMeetLogo from '../../assets/images/7089160_google_meet_icon.png'

interface GoogleMeetIconProps {
  size?: number | string
  className?: string
}

export function GoogleMeetIcon({ className, size = 48 }: GoogleMeetIconProps) {
  return (
    <img
      src={googleMeetLogo.src}
      alt="Google Meet"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
