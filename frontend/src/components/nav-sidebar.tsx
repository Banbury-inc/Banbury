import { Home, FolderOpen, LogOut, Settings, UserStarIcon} from "lucide-react"
import Image from 'next/image'
import { useRouter } from "next/router"
import { useState, useEffect } from "react"

import { Button } from "./ui/button"
import BanburyLogo from "../assets/images/Logo.png"

interface NavSidebarProps {
  onLogout?: () => void
}

export function NavSidebar({ onLogout }: NavSidebarProps) {
  const router = useRouter()
  const [username, setUsername] = useState<string>('')

  useEffect(() => {
    // Get username from localStorage
    if (typeof window !== 'undefined') {
      const storedUsername = localStorage.getItem('username')
      setUsername(storedUsername || '')
    }
  }, [])

  const navItems = [
    {
      id: 'dashboard',
      icon: Home,
      label: 'Dashboard',
      path: '/dashboard'
    },
    {
      id: 'workspaces',
      icon: FolderOpen,
      label: 'Workspaces',
      path: '/workspaces'
    },
    {
      id: 'settings',
      icon: Settings,
      label: 'Settings',
      path: '/settings'
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
    <div className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col bg-black border-r border-b border-zinc-300 dark:border-zinc-600">
      <div className="flex flex-1 flex-col items-center gap-4 py-4">
        {/* Logo/Brand */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg p-1">
          <Image 
            src={BanburyLogo} 
            alt="Banbury Logo" 
            className="h-full w-full object-contain"
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
              <div key={item.id} className="relative">
                <Button
                  variant={isActive(item.path) ? "default" : "ghost"}
                  size="icon"
                  className="h-10 w-10 text-white hover:bg-zinc-700 hover:text-white bg-black border border-zinc-300 dark:border-zinc-600 transition-colors peer"
                  onClick={() => router.push(item.path)}
                >
                  <Icon className="h-5 w-5" />
                </Button>
                {/* Custom CSS tooltip for testing */}
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-50 top-1/2 -translate-y-1/2">
                  {item.label}
                </div>
              </div>
            )
          })}
        </nav>
      </div>
      
      {/* Footer with Logout Button */}
      {onLogout && (
        <div className="flex items-center justify-center pb-4">
          <div className="relative">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 text-white hover:bg-zinc-700 hover:text-white border border-zinc-300 dark:border-zinc-600 transition-colors peer"
              onClick={onLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
            {/* Custom CSS tooltip for testing */}
            <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 invisible peer-hover:opacity-100 peer-hover:visible transition-all duration-200 z-50 top-1/2 -translate-y-1/2">
              Logout
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
