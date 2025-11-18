import React from 'react'
import outlookLogo from '../../assets/images/Microsoft_Office_Outlook_Logo_512px.png'

interface OutlookIconProps {
  size?: number | string
  className?: string
}

export function OutlookIcon({ size = 48, className }: OutlookIconProps) {
  return (
    <img
      src={outlookLogo.src}
      alt="Microsoft Outlook"
      width={size}
      height={size}
      className={className}
    />
  )
}
