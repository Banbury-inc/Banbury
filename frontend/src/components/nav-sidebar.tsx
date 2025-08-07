import { Home, FolderOpen, LogOut } from "lucide-react"
import { useNavigate, useLocation } from "react-router-dom"
import { Button } from "./ui/button"
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip"
import BanburyLogo from "../assets/images/Banbury_Cloud_Logo.png"

interface NavSidebarProps {
  onLogout?: () => void
}

export function NavSidebar({ onLogout }: NavSidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()

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
    }
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="fixed left-0 top-0 z-40 flex h-full w-16 flex-col bg-black border-r border-b border-zinc-300 dark:border-zinc-600">
      <div className="flex flex-1 flex-col items-center gap-4 py-4">
        {/* Logo/Brand */}
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white p-1">
          <img 
            src={BanburyLogo} 
            alt="Banbury Logo" 
            className="h-full w-full object-contain"
          />
        </div>
        
        {/* Navigation Items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <Tooltip key={item.id}>
                <TooltipTrigger asChild>
                  <Button
                    variant={isActive(item.path) ? "default" : "ghost"}
                    size="icon"
                    className="h-10 w-10 text-white hover:bg-primary hover:text-white bg-black border border-zinc-300 dark:border-zinc-600"
                    onClick={() => navigate(item.path)}
                  >
                    <Icon className="h-5 w-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="right" sideOffset={8}>
                  {item.label}
                </TooltipContent>
              </Tooltip>
            )
          })}
        </nav>
      </div>
      
      {/* Footer with Logout Button */}
      {onLogout && (
        <div className="flex items-center justify-center pb-4">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 text-white hover:bg-black hover:text-white border border-zinc-300 dark:border-zinc-600"
                onClick={onLogout}
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              Logout
            </TooltipContent>
          </Tooltip>
        </div>
      )}
    </div>
  )
}
