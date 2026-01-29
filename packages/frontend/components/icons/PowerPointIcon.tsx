import React from 'react'

interface PowerPointIconProps {
  size?: number | string
  className?: string
}

export function PowerPointIcon({ size = 48, className }: PowerPointIconProps) {
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
      <rect width="48" height="48" rx="4" fill="#D24726"/>
      <path
        d="M16 14H22C25.866 14 29 17.134 29 21C29 24.866 25.866 28 22 28H19V34H16V14ZM19 17V25H22C24.2091 25 26 23.2091 26 21C26 18.7909 24.2091 17 22 17H19Z"
        fill="white"
      />
    </svg>
  )
}
