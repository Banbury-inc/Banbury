'use client'

import * as React from 'react'
import { Button } from '../../../components/ui/button'
import { detectOperatingSystem, getDesktopDownloadUrl } from '../../../utils/getDesktopDownloadUrl'
import { cn } from '../../../lib/utils'

interface DesktopDownloadButtonProps extends React.ComponentProps<typeof Button> {
  fallbackText?: string
  className?: string
}

const GITHUB_REPO_OWNER = 'Banbury-inc'
const GITHUB_REPO_NAME = 'Banbury'

function getDownloadButtonText(os: ReturnType<typeof detectOperatingSystem>): string {
  if (os.platform === 'windows') {
    return 'Download for Windows'
  }
  if (os.platform === 'macos') {
    return 'Download for macOS'
  }
  if (os.platform === 'linux') {
    return 'Download for Linux'
  }
  return 'Download Desktop App'
}

export function DesktopDownloadButton({
  fallbackText,
  className,
  variant = 'default',
  size = 'lg',
  ...props
}: DesktopDownloadButtonProps) {
  const [downloadUrl, setDownloadUrl] = React.useState<string | null>(null)
  const [buttonText, setButtonText] = React.useState<string>('Download Desktop App')
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    async function loadDownloadInfo() {
      setIsLoading(true)

      try {
        const os = detectOperatingSystem()
        const text = fallbackText || getDownloadButtonText(os)
        setButtonText(text)

        const url = await getDesktopDownloadUrl()
        setDownloadUrl(url)
      } catch (err) {
        console.error('Failed to load download information:', err)
        // Fallback to GitHub releases page
        setDownloadUrl(`https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`)
      } finally {
        setIsLoading(false)
      }
    }

    loadDownloadInfo()
  }, [fallbackText])

  const handleClick = () => {
    const url = downloadUrl || `https://github.com/${GITHUB_REPO_OWNER}/${GITHUB_REPO_NAME}/releases/latest`

    // Create a temporary anchor element to trigger direct download
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', '') // Suggests download behavior
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={isLoading}
      className={cn(className)}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2">Loading...</span>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        </>
      ) : (
        buttonText
      )}
    </Button>
  )
}
