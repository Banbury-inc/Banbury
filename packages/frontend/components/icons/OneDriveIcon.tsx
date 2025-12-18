import React from 'react'

interface OneDriveIconProps {
  size?: number | string
  className?: string
}

export function OneDriveIcon({ size = 48, className }: OneDriveIconProps) {
  const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size
  return (
    <svg
      width={sizeNum}
      height={sizeNum}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* OneDrive cloud icon - blue */}
      <path
        d="M19.35 10.04A7.49 7.49 0 0 0 12 4c-2.89 0-5.4 1.64-6.65 4.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z"
        fill="#0078D4"
      />
      {/* Light blue accent */}
      <path
        d="M6.5 14.5c0-2.21 1.79-4 4-4 1.55 0 2.89.89 3.55 2.19A3.5 3.5 0 0 1 17.5 16h.5a4 4 0 0 0-.15-1.04A5.5 5.5 0 0 0 7.5 11.5a5.48 5.48 0 0 0-1 3h.1c-.07.33-.1.66-.1 1 0 3.31 2.69 6 6 6h6.5a3.5 3.5 0 0 0 0-7h-1.55A4.002 4.002 0 0 0 14 12a4 4 0 0 0-3.45 2h-.05c-2.21 0-4 1.79-4 4z"
        fill="#50E6FF"
        opacity="0.6"
      />
    </svg>
  )
}
