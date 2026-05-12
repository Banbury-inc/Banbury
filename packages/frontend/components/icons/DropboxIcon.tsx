import React from 'react'

interface DropboxIconProps {
  size?: number | string
  className?: string
}

export function DropboxIcon({ size = 48, className }: DropboxIconProps) {
  const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size

  return (
    <svg
      width={sizeNum}
      height={sizeNum}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path d="M6.5 2.75 1.5 6l5 3.25 5-3.25-5-3.25Z" fill="#0061FF" />
      <path d="M17.5 2.75 12.5 6l5 3.25 5-3.25-5-3.25Z" fill="#0061FF" />
      <path d="M6.5 9.75 1.5 13l5 3.25 5-3.25-5-3.25Z" fill="#0061FF" />
      <path d="M17.5 9.75 12.5 13l5 3.25 5-3.25-5-3.25Z" fill="#0061FF" />
      <path d="M12 14.25 7 17.5l5 3.25 5-3.25-5-3.25Z" fill="#0061FF" />
    </svg>
  )
}
