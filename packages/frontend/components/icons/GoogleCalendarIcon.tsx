import React from 'react'
import googleCalendarLogo from '../../assets/images/7123030_google_calendar_icon.png'

interface GoogleCalendarIconProps {
  size?: number | string
  className?: string
}

export function GoogleCalendarIcon({ className, size = 200 }: GoogleCalendarIconProps) {
  return (
    <img
      src={googleCalendarLogo.src}
      alt="Google Calendar"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block', objectFit: 'contain' }}
    />
  )
}
