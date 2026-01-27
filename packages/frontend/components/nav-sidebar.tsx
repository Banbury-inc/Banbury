import { LogOut, Settings, Folder, Mail, Calendar, CheckSquare, Video, UserCog, Download } from "lucide-react"
import Image from 'next/image'
import { useRouter } from "next/router"
import type { NextRouter } from "next/router"
import { useState, useEffect } from "react"

import { Button } from "./ui/button"
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar"
import { Badge } from "./ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "./ui/dropdown-menu"
import { SettingsModal } from "./modals/SettingsModal"
import { ApiService } from "../../backend/api/apiService"
import BanburyLogo from "../assets/images/New_Logo.png"
import { Typography } from "./ui/typography"
import { handleDownloadDesktopApp } from "./nav-sidebar/handlers/handleDownloadDesktopApp"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip"
import type { NextRouter } from "next/router"

function handleLogout(router: NextRouter) {
  // Clear all authentication data using ApiService
  ApiService.clearAuthToken();
  
  // Clear any additional session data
  localStorage.removeItem('deviceId');
  localStorage.removeItem('googleOAuthSession');
  localStorage.removeItem('userData');
  
  // Redirect to home page
  router.push('/');
}

function handleLogout(router: NextRouter) {
  // Clear all authentication data using ApiService
  ApiService.clearAuthToken();
  
  // Clear any additional session data
  localStorage.removeItem('deviceId');
  localStorage.removeItem('googleOAuthSession');
  localStorage.removeItem('userData');
  
  // Redirect to home page
  router.push('/');
}

interface NavSidebarProps {
  activeTab?: string
  onTabChange?: (tab: string) => void
  showAdminToggle?: boolean
}

const workspaceTabs = [
  { id: 'files', icon: Folder, label: 'Files' },
  { id: 'email', icon: Mail, label: 'Email' },
  { id: 'calendar', icon: Calendar, label: 'Calendar' },
  { id: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { id: 'meetings', icon: Video, label: 'Meetings' },
]

function isElectronApp(): boolean {
  return typeof window !== 'undefined' && !!window.desktopApp?.isDesktop
}

export function NavSidebar({ activeTab = 'files', onTabChange, showAdminToggle = false }: NavSidebarProps) {
  const router = useRouter()
  const [username, setUsername] = useState<string>('')
  const [userPicture, setUserPicture] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>('U')
  const [subscription, setSubscription] = useState<string>('free')
  const [settingsOpen, setSettingsOpen] = useState(false)

  // Conditionally add admin tab if user is authorized
  const allTabs = showAdminToggle
    ? [...workspaceTabs, { id: 'admin', icon: UserCog, label: 'Admin' }]
    : workspaceTabs

  useEffect(() => {
    // Get user info from localStorage
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      const storedPicture = localStorage.getItem('userPicture')
      const storedFirstName = localStorage.getItem('userFirstName')
      const storedLastName = localStorage.getItem('userLastName')
      const storedEmail = localStorage.getItem('userEmail')
      
      setUsername(storedUsername || '')
      setUserPicture(storedPicture)
      
      // Generate initials
      if (storedFirstName && storedLastName) {
        setUserInitials(`${storedFirstName[0]}${storedLastName[0]}`.toUpperCase())
      } else if (storedFirstName) {
        setUserInitials(storedFirstName[0].toUpperCase())
      } else if (storedEmail) {
        setUserInitials(storedEmail[0].toUpperCase())
      } else if (storedUsername) {
        setUserInitials(storedUsername[0].toUpperCase())
      }
      
      // Load subscription status
      loadSubscription()
    }
  }, [])

  // Handle openSettings query param (for OAuth callbacks)
  useEffect(() => {
    if (router.isReady && router.query.openSettings === 'true') {
      setSettingsOpen(true)
      // Clean up only the openSettings param, keep others for SettingsModal
      const { openSettings, ...rest } = router.query
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
    }
  }, [router.isReady, router.query.openSettings])

  const loadSubscription = async () => {
    try {
      const response = await ApiService.get('/billing/check-payment-status/') as any
      if (response.subscription) {
        setSubscription(response.subscription)
      }
    } catch (error) {
      console.error('Error loading subscription:', error)
      // Keep default 'free' status on error
    }
  }

  function handleSettingsOpenChange(open: boolean) {
    setSettingsOpen(open)
    // Refresh subscription when closing settings modal
    if (!open) {
      loadSubscription()
    }
  }

  return (
    <TooltipProvider>
      <div className="fixed left-0 top-0 z-40 flex h-full w-[48px] flex-col bg-card border-r border-zinc-200 dark:border-white/[0.06] shadow-soft">
        <div className="flex flex-1 flex-col items-center gap-2 py-4">
          {/* Logo/Brand */}
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg p-1 cursor-pointer hover:bg-accent dark:hover:bg-accent transition-all duration-200 hover:scale-110 active:scale-95 mb-2"
            onClick={() => router.push('/')}
          >
            <Image
              src={BanburyLogo}
              alt="Banbury Logo"
              className="h-full w-full object-contain invert dark:invert-0 transition-transform"
              width={32}
              height={32}
              priority
            />
          </div>

          {/* Navigation Tabs */}
          <div className="flex flex-col items-center gap-1 w-full px-1">
            {allTabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <Tooltip key={tab.id} delayDuration={300}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onTabChange?.(tab.id)}
                      className={`flex h-9 w-9 items-center justify-center rounded-lg transition-all duration-200 hover:scale-110 active:scale-95 ${
                        isActive
                          ? 'bg-primary text-primary-foreground shadow-sm'
                          : 'text-muted-foreground hover:bg-accent dark:hover:bg-accent hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" strokeWidth={1.5} />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="font-normal">
                    {tab.label}
                  </TooltipContent>
                </Tooltip>
              )
            })}
          </div>
        </div>

        {/* Footer with User Avatar */}
        <div className="flex items-center justify-center pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-accent dark:hover:ring-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent hover:scale-110 active:scale-95">
                <Avatar className="h-8 w-8 cursor-pointer">
                  {userPicture && (
                    <AvatarImage src={userPicture} alt={username || 'User'} />
                  )}
                  <AvatarFallback className="bg-accent dark:bg-accent text-accent-foreground dark:text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56 bg-accent border-border">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <Typography variant="p">{username}</Typography>
                  <div className="flex items-center gap-2 mt-1">
                    {subscription === 'pro' ? (
                      <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                        Pro
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        Free
                      </Badge>
                    )}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-zinc-200 dark:bg-white/[0.06]" />
              <DropdownMenuItem onClick={() => setSettingsOpen(true)} className="cursor-pointer hover:bg-accent dark:hover:bg-accent py-2 transition-all">
                <Settings className="mr-2 h-4 w-4" strokeWidth={1} />
                <Typography variant="small">Settings</Typography>
              </DropdownMenuItem>
              {!isElectronApp() && (
                <DropdownMenuItem onClick={handleDownloadDesktopApp} className="cursor-pointer hover:bg-accent dark:hover:bg-accent py-2 transition-all">
                  <Download className="mr-2 h-4 w-4" strokeWidth={1} />
                  <Typography variant="small">Download desktop app</Typography>
                </DropdownMenuItem>
              )}
              <DropdownMenuItem onClick={() => handleLogout(router)} className="cursor-pointer hover:bg-red-500/10 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 py-2 transition-all">
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1} />
                <Typography variant="small">Logout</Typography>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <SettingsModal open={settingsOpen} onOpenChange={handleSettingsOpenChange} />
      </div>
    </TooltipProvider>
  )
}
