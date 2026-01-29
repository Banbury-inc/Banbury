import React from 'react'

interface GoogleSlidesIconProps {
  size?: number | string
  className?: string
}

export function GoogleSlidesIcon({ size = 48, className }: GoogleSlidesIconProps) {
  const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size
  return (
    <svg
      width={sizeNum}
      height={sizeNum}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="48" height="48" rx="4" fill="#FBBC04"/>
      <path
        d="M15 20H33V22H15V20ZM15 25H33V27H15V25ZM15 30H27V32H15V30Z"
        fill="white"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 14C12 12.8954 12.8954 12 14 12H34C35.1046 12 36 12.8954 36 14V34C36 35.1046 35.1046 36 34 36H14C12.8954 36 12 35.1046 12 34V14ZM14 14V34H34V14H14Z"
        fill="white"
      />
    </svg>
  )
}
