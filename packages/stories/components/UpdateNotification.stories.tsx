import React, { useEffect } from "react"
import type { Meta, StoryObj } from "@storybook/react"
import { UpdateNotification } from "frontend/components/UpdateNotification"

// Mock updater API
interface MockUpdater {
  getCurrentVersion: () => Promise<string>
  checkForUpdates: () => Promise<{ available: boolean; error?: string; currentVersion?: string }>
  downloadUpdate: () => Promise<{ success: boolean; error?: string }>
  installUpdate: () => Promise<{ success: boolean; error?: string }>
  onCheckingForUpdate: (callback: () => void) => () => void
  onUpdateAvailable: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void
  onUpdateNotAvailable: (callback: (info: { version: string }) => void) => () => void
  onUpdateError: (callback: (error: { message: string }) => void) => () => void
  onDownloadProgress: (callback: (progress: { percent: number; transferred: number; total: number }) => void) => () => void
  onUpdateDownloaded: (callback: (info: { version: string; releaseDate?: string; releaseNotes?: string }) => void) => () => void
}

interface StoryWrapperProps {
  children: React.ReactNode
  mockSetup?: (updater: MockUpdater) => void
  currentVersion?: string
  autoTrigger?: 'available' | 'downloading' | 'downloaded' | 'error'
  updateInfo?: {
    version?: string
    releaseDate?: string
    releaseNotes?: string
  }
}

function StoryWrapper({ children, mockSetup, currentVersion = '1.0.0', autoTrigger, updateInfo }: StoryWrapperProps) {
  useEffect(() => {
    // Store original if it exists
    const originalDesktopApp = (window as any).desktopApp

    // Create mock updater with listeners storage
    const listeners: {
      checking: (() => void)[]
      available: ((info: { version: string; releaseDate?: string; releaseNotes?: string }) => void)[]
      notAvailable: ((info: { version: string }) => void)[]
      error: ((error: { message: string }) => void)[]
      progress: ((progress: { percent: number; transferred: number; total: number }) => void)[]
      downloaded: ((info: { version: string; releaseDate?: string; releaseNotes?: string }) => void)[]
    } = {
      checking: [],
      available: [],
      notAvailable: [],
      error: [],
      progress: [],
      downloaded: [],
    }

    // Default update info
    const defaultUpdateInfo = {
      version: updateInfo?.version || '1.1.0',
      releaseDate: updateInfo?.releaseDate || new Date().toISOString(),
      releaseNotes: updateInfo?.releaseNotes || 'New features and bug fixes'
    }

    // Function to trigger events (exposed on window for testing)
    const triggerEvent = (type: string, data?: any) => {
      switch (type) {
        case 'available':
          listeners.available.forEach(cb => cb({
            ...defaultUpdateInfo,
            ...data
          }))
          break
        case 'downloaded':
          listeners.downloaded.forEach(cb => cb({
            ...defaultUpdateInfo,
            ...data
          }))
          break
        case 'error':
          listeners.error.forEach(cb => cb({ message: data?.message || 'Update error occurred' }))
          break
        case 'progress':
          listeners.progress.forEach(cb => cb(data || { percent: 50, transferred: 5000000, total: 10000000 }))
          break
      }
    }

    const mockUpdater: MockUpdater = {
      getCurrentVersion: () => Promise.resolve(currentVersion),
      checkForUpdates: () => Promise.resolve({ available: false, currentVersion }),
      downloadUpdate: () => {
        // Simulate download progress
        let progress = 0
        const interval = setInterval(() => {
          progress += 10
          triggerEvent('progress', { percent: progress, transferred: progress * 1000000, total: 10000000 })
          
          if (progress >= 100) {
            clearInterval(interval)
            setTimeout(() => {
              triggerEvent('downloaded', defaultUpdateInfo)
            }, 500)
          }
        }, 200)
        
        return Promise.resolve({ success: true })
      },
      installUpdate: () => {
        console.log('In a real app, this would restart the app to install the update.')
        return Promise.resolve({ success: true })
      },
      onCheckingForUpdate: (callback) => {
        listeners.checking.push(callback)
        return () => {
          const index = listeners.checking.indexOf(callback)
          if (index > -1) listeners.checking.splice(index, 1)
        }
      },
      onUpdateAvailable: (callback) => {
        listeners.available.push(callback)
        return () => {
          const index = listeners.available.indexOf(callback)
          if (index > -1) listeners.available.splice(index, 1)
        }
      },
      onUpdateNotAvailable: (callback) => {
        listeners.notAvailable.push(callback)
        return () => {
          const index = listeners.notAvailable.indexOf(callback)
          if (index > -1) listeners.notAvailable.splice(index, 1)
        }
      },
      onUpdateError: (callback) => {
        listeners.error.push(callback)
        return () => {
          const index = listeners.error.indexOf(callback)
          if (index > -1) listeners.error.splice(index, 1)
        }
      },
      onDownloadProgress: (callback) => {
        listeners.progress.push(callback)
        return () => {
          const index = listeners.progress.indexOf(callback)
          if (index > -1) listeners.progress.splice(index, 1)
        }
      },
      onUpdateDownloaded: (callback) => {
        listeners.downloaded.push(callback)
        return () => {
          const index = listeners.downloaded.indexOf(callback)
          if (index > -1) listeners.downloaded.splice(index, 1)
        }
      },
    }

    // Allow custom setup
    if (mockSetup) {
      mockSetup(mockUpdater)
    }

    // Set up window.desktopApp
    ;(window as any).desktopApp = {
      isDesktop: true,
      updater: mockUpdater,
    }

    // Auto-trigger events based on story (wait a bit for component to mount and subscribe)
    if (autoTrigger === 'available') {
      setTimeout(() => {
        triggerEvent('available')
      }, 300)
    } else if (autoTrigger === 'downloading') {
      setTimeout(() => {
        triggerEvent('available')
        // Start progress simulation
        let progress = 0
        const interval = setInterval(() => {
          progress += 5
          triggerEvent('progress', { percent: progress, transferred: progress * 1000000, total: 10000000 })
          if (progress >= 100) {
            clearInterval(interval)
          }
        }, 100)
      }, 300)
    } else if (autoTrigger === 'downloaded') {
      setTimeout(() => {
        triggerEvent('available')
        setTimeout(() => {
          triggerEvent('downloaded')
        }, 500)
      }, 300)
    } else if (autoTrigger === 'error') {
      setTimeout(() => {
        triggerEvent('available')
        setTimeout(() => {
          triggerEvent('error', { message: 'Failed to download update. Please check your internet connection.' })
        }, 500)
      }, 300)
    }

    // Cleanup
    return () => {
      if (originalDesktopApp) {
        ;(window as any).desktopApp = originalDesktopApp
      } else {
        delete (window as any).desktopApp
      }
    }
  }, [mockSetup, currentVersion, autoTrigger, updateInfo])

  return <>{children}</>
}

const meta: Meta<typeof UpdateNotification> = {
  title: "Components/UpdateNotification",
  component: UpdateNotification,
  decorators: [
    (Story, context) => {
      const { autoTrigger, currentVersion, updateInfo } = context.args as any
      return (
        <StoryWrapper 
          autoTrigger={autoTrigger} 
          currentVersion={currentVersion}
          updateInfo={updateInfo}
        >
          <div className="relative w-full h-screen bg-background p-8">
            <Story />
          </div>
        </StoryWrapper>
      )
    },
  ],
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component: `
# UpdateNotification Component

A notification component that displays when an Electron app update is available. It handles the full update lifecycle from detection to installation.

## Features

- **Auto-detection**: Automatically shows when an update is detected
- **Download Progress**: Shows real-time download progress with a progress bar
- **User Actions**: Allows users to download, install, or dismiss updates
- **Error Handling**: Displays error messages if updates fail
- **Version Info**: Shows current and available versions

## States

1. **Update Available**: Initial state when an update is detected
2. **Downloading**: Shows progress bar during download
3. **Downloaded**: Ready to install, prompts user to restart
4. **Error**: Displays error message if something goes wrong

## Usage

The component only renders in Electron environments and when an update is available. It automatically subscribes to update events from the Electron main process.
        `,
      },
    },
  },
  tags: ["autodocs"],
}

export default meta

type Story = StoryObj<typeof UpdateNotification>

export const UpdateAvailable: Story = {
  name: "Update Available",
  args: {
    autoTrigger: 'available',
    currentVersion: '1.0.0',
  },
}

export const Downloading: Story = {
  name: "Downloading",
  args: {
    autoTrigger: 'downloading',
    currentVersion: '1.0.0',
  },
}

export const Downloaded: Story = {
  name: "Downloaded - Ready to Install",
  args: {
    autoTrigger: 'downloaded',
    currentVersion: '1.0.0',
  },
}

export const Error: Story = {
  name: "Download Error",
  args: {
    autoTrigger: 'error',
    currentVersion: '1.0.0',
  },
}

export const WithReleaseNotes: Story = {
  name: "With Release Notes",
  args: {
    autoTrigger: 'available',
    currentVersion: '1.0.0',
    updateInfo: {
      version: '1.2.0',
      releaseDate: new Date().toISOString(),
      releaseNotes: '## New Features\n- Dark mode improvements\n- Performance optimizations\n- Bug fixes'
    },
  },
}

export const NewerVersion: Story = {
  name: "Newer Version Available",
  args: {
    autoTrigger: 'available',
    currentVersion: '1.0.5',
  },
}
