import { FolderOpen, LogOut, Settings, UserStarIcon, Brain, Workflow, Video, Crown} from "lucide-react"
import Image from 'next/image'
import { useRouter } from "next/router"
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
import BanburyLogo from "../assets/images/Logo.png"
import { Typography } from "./ui/typography"

interface NavSidebarProps {
  onLogout?: () => void
}

export function NavSidebar({ onLogout }: NavSidebarProps) {
  const router = useRouter()
  const [username, setUsername] = useState<string>('')
  const [userPicture, setUserPicture] = useState<string | null>(null)
  const [userInitials, setUserInitials] = useState<string>('U')
  const [subscription, setSubscription] = useState<string>('free')
  const [settingsOpen, setSettingsOpen] = useState(false)

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

  const navItems = [
    {
      id: 'workspaces',
      icon: FolderOpen,
      label: 'Workspaces',
      path: '/workspaces'
    },
    {
      id: 'task-studio',
      icon: Workflow,
      label: 'Task Studio',
      path: '/task-studio'
    },
    // Only include meeting agent item if user is mmills or mmills6060@gmail.com
    ...(username === 'mmills' || username === 'mmills6060@gmail.com' ? [{
      id: 'meeting-agent',
      icon: Video,
      label: 'Meetings',
      path: '/meeting-agent'
    }] : []),
    {
      id: 'knowledge',
      icon: Brain,
      label: 'Knowledge',
      path: '/knowledge'
    },
    // Only include admin item if user is mmills or mmills6060@gmail.com
    ...(username === 'mmills' || username === 'mmills6060@gmail.com' ? [{
      id: 'admin',
      icon: UserStarIcon,
      label: 'Admin',
      path: '/admin'
    }] : [])
  ]

  const isActive = (path: string) => router.pathname === path

  return (
    <div className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col bg-background border-r border-zinc-300 dark:border-white/[0.06] shadow-soft">
      <div className="flex flex-1 flex-col items-center gap-4 py-4">
        {/* Logo/Brand */}
        <div 
          className="flex h-8 w-8 items-center justify-center rounded-lg p-1 cursor-pointer hover:bg-accent dark:hover:bg-accent transition-all duration-200 hover:scale-110 active:scale-95"
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
        
        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <div key={item.id} className="relative group">
                <Button
                  variant={isActive(item.path) ? "primary" : "ghost"}
                  size="icon"
                  onClick={() => router.push(item.path)}
                  className={isActive(item.path) ? "shadow-md" : ""}
                >
                  <Icon className="h-5 w-5 text-muted-foreground dark:text-white" strokeWidth={1} />
                </Button>
                {/* Custom CSS tooltip */}
                <div className="absolute left-full ml-3 px-3 py-2 bg-zinc-900 dark:bg-zinc-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 top-1/2 -translate-y-1/2 border border-zinc-700 dark:border-white/[0.08] shadow-xl animate-in fade-in slide-in-from-left-2">
                  {item.label}
                  <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-zinc-900 dark:bg-zinc-800 border-l border-b border-zinc-700 dark:border-white/[0.08]"></div>
                </div>
              </div>
            )
          })}
        </nav>
      </div>
      
      {/* Footer with User Avatar */}
      {onLogout && (
        <div className="flex items-center justify-center pb-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center justify-center rounded-full hover:ring-2 hover:ring-accent dark:hover:ring-accent transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-accent dark:focus:ring-accent hover:scale-110 active:scale-95">
                <Avatar className="h-10 w-10 cursor-pointer">
                  {userPicture && (
                    <AvatarImage src={userPicture} alt={username || 'User'} />
                  )}
                  <AvatarFallback className="bg-accent dark:bg-accent text-accent-foreground dark:text-white">
                    {userInitials}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <Typography variant="p">{username}</Typography>
                  <div className="flex items-center gap-2 mt-1">
                    {subscription === 'pro' ? (
                      <Badge variant="default" className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white border-0">
                        <Crown className="mr-1 h-4 w-4" strokeWidth={1} />
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
              <DropdownMenuItem onClick={onLogout} className="cursor-pointer hover:bg-red-500/10 dark:hover:bg-red-500/10 text-red-500 dark:text-red-400 py-2 transition-all">
                <LogOut className="mr-2 h-4 w-4" strokeWidth={1} />
                <Typography variant="small">Logout</Typography>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      <SettingsModal open={settingsOpen} onOpenChange={handleSettingsOpenChange} />
    </div>
  )
}
