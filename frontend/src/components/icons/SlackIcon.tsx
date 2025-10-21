import React from 'react'

interface SlackIconProps {
  size?: number | string
  className?: string
}

export function SlackIcon({ className, size = 48 }: SlackIconProps) {
  return (
    <svg 
      viewBox="0 0 124 124" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={className}
      style={{ display: 'block' }}
    >
      <path d="M26.4 78.7a13.2 13.2 0 1 1-13.2-13.2h13.2v13.2Z" fill="#E01E5A"/>
      <path d="M32.9 78.7a13.2 13.2 0 0 1 26.4 0v33a13.2 13.2 0 1 1-26.4 0v-33Z" fill="#E01E5A"/>
      <path d="M46.1 26.4a13.2 13.2 0 1 1 13.2-13.2v13.2H46.1Z" fill="#36C5F0"/>
      <path d="M46.1 32.9a13.2 13.2 0 0 1 0 26.4h-33a13.2 13.2 0 1 1 0-26.4h33Z" fill="#36C5F0"/>
      <path d="M98.4 46.1a13.2 13.2 0 1 1 13.2 13.2H98.4V46.1Z" fill="#2EB67D"/>
      <path d="M91.9 46.1a13.2 13.2 0 0 1-26.4 0v-33a13.2 13.2 0 1 1 26.4 0v33Z" fill="#2EB67D"/>
      <path d="M78.7 98.4a13.2 13.2 0 1 1-13.2 13.2V98.4h13.2Z" fill="#ECB22E"/>
      <path d="M78.7 91.9a13.2 13.2 0 0 1 0-26.4h33a13.2 13.2 0 1 1 0 26.4h-33Z" fill="#ECB22E"/>
    </svg>
  )
}
