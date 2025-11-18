import React from 'react'
import googleDocsLogo from '../../assets/images/Google_Docs_Logo_512px.png'

interface GoogleDocsIconProps {
  size?: number | string
  className?: string
}

export function GoogleDocsIcon({ size = 48, className }: GoogleDocsIconProps) {
  return (
    <img
      src={googleDocsLogo.src}
      alt="Google Docs"
      width={size}
      height={size}
      className={className}
    />
  )
}
