import React from 'react'
import Image from 'next/image'
import googleDriveLogo from '../../assets/images/Google_Drive_Logo_512px.png'

interface GoogleDriveIconProps {
  size?: number | string
  className?: string
}

export function GoogleDriveIcon({ size = 48, className }: GoogleDriveIconProps) {
  const sizeNum = typeof size === 'string' ? parseInt(size, 10) : size
  return (
    <Image
      src={googleDriveLogo}
      alt="Google Drive"
      width={sizeNum}
      height={sizeNum}
      className={className}
    />
  )
}

