import React from 'react'
import gmailLogo from '../../assets/images/Gmail_Logo_512px.png'

interface GmailIconProps {
  size?: number | string
  className?: string
}

export function GmailIcon({ size = 48, className }: GmailIconProps) {
  return (
    <img
      src={gmailLogo.src}
      alt="Gmail"
      width={size}
      height={size}
      className={className}
    />
  )
}
