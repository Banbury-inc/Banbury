import React from 'react'

interface TeamsIconProps {
  size?: number | string
  className?: string
}

export function TeamsIcon({ className, size = 16 }: TeamsIconProps) {
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
      <rect width="24" height="24" rx="4" fill="#464EB8" />
      <path
        d="M12 7.5C10.34 7.5 9 8.84 9 10.5C9 12.16 10.34 13.5 12 13.5C13.66 13.5 15 12.16 15 10.5C15 8.84 13.66 7.5 12 7.5Z"
        fill="#fff"
      />
      <path
        d="M7.5 16.5C7.5 15.12 8.62 14 10 14H14C15.38 14 16.5 15.12 16.5 16.5V18H7.5V16.5Z"
        fill="#fff"
      />
      <path
        d="M17.5 9.5C17.5 8.67 18.17 8 19 8C19.83 8 20.5 8.67 20.5 9.5V11.5H17.5V9.5Z"
        fill="#fff"
      />
      <path
        d="M6.5 9.5C6.5 8.67 5.83 8 5 8C4.17 8 3.5 8.67 3.5 9.5V11.5H6.5V9.5Z"
        fill="#fff"
      />
    </svg>
  )
}
