import React from 'react'
import googleSheetsLogo from '../../assets/images/Google_Sheets_Logo_512px.png'

interface GoogleSheetsIconProps {
  size?: number | string
  className?: string
}

export function GoogleSheetsIcon({ size = 48, className }: GoogleSheetsIconProps) {
  return (
    <img
      src={googleSheetsLogo.src}
      alt="Google Sheets"
      width={size}
      height={size}
      className={className}
    />
  )
}
