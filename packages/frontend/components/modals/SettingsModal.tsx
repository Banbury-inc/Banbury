import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { 
  User, 
  Link,
  CreditCard,
  XCircle,
  X,
  Palette,
  Video,
  Brain,
  Keyboard,
  BarChart3,
  Info,
} from 'lucide-react'

import { Button } from '../common/ui/button'
import { cn } from '../../lib/utils'
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from '../common/ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ApiService } from '../../../backend/api/apiService'
import { loadStripe } from '@stripe/stripe-js'
import { Elements } from '@stripe/react-stripe-js'
import { useToast } from '../common/ui/use-toast'
import { Toaster } from '../common/ui/toaster'
import { Typography } from '../common/ui/typography'
import { 
  ProfileTab, 
  AppearanceTab, 
  SubscriptionTab, 
  ConnectionsTab,
  MeetingAgentTab,
  AISettingsTab,
  KeybindsTab,
  UsageTab,
  AboutTab,
} from './settings-tabs'
import { handleUpdateProfile } from './handlers/settingsHandlers'
import { CheckoutForm } from './CheckoutForm'

const stripePromise = loadStripe('pk_live_51PGNdQJ2FLdDk2RmRpHZE9kX2yHJ9rIiVr5t8JfmV5eB1LyazU2uei7Qe0GdkpTnsMOz69w6hPNsU3KDmbUxyGOx00WxE03DQP')

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface UserInfo {
  username: string
  email: string
  first_name: string
  last_name: string
}

interface PaymentStatus {
  subscription: 'pro' | 'free'
  payment_status: string
  payment_succeeded: boolean
  payment_succeeded_at?: string
}

interface PaymentIntentResponse {
  clientSecret?: string
}

async function checkPaymentStatus() {
  try {
    const response = await ApiService.get<PaymentStatus>('/billing/check-payment-status/')
    return response
  } catch (error) {
    console.error('Error checking payment status:', error)
    throw error
  }
}

export function SettingsModal({ open, onOpenChange }: Readonly<SettingsModalProps>) {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)
  const [scopeActivated, setScopeActivated] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<PaymentStatus | null>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [isDarkMode, setIsDarkMode] = useState(theme === 'dark')

  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
    },
    {
      id: 'appearance',
      label: 'Appearance',
      icon: Palette,
    },
    {
      id: 'keybinds',
      label: 'Keyboard Shortcuts',
      icon: Keyboard,
    },
    {
      id: 'ai-settings',
      label: 'AI Settings',
      icon: Brain,
    },
    {
      id: 'meeting-agent',
      label: 'Meeting Agent',
      icon: Video,
    },
    {
      id: 'connections',
      label: 'Connections',
      icon: Link,
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: BarChart3,
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
    },
    {
      id: 'about',
      label: 'About',
      icon: Info,
    },
  ]

  useEffect(() => {
    if (open) {
      loadUserInfo()
    }
  }, [open])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const localTheme = localStorage.getItem('themeMode')
      setIsDarkMode(localTheme !== 'light')
    }
  }, [open])

  useEffect(() => {
    if (router.query.scopeActivated === 'true') {
      setScopeActivated(true)
      setActiveTab('connections')
      router.replace(router.pathname, undefined, { shallow: true })
    }

    if (router.query.x_connected === 'true') {
      toast({
        title: "X Account Connected",
        description: "Successfully connected to your X account!",
      })
      setActiveTab('connections')
      router.replace(router.pathname, undefined, { shallow: true })
    }

    if (router.query.outlook_connected === 'true') {
      toast({
        title: "Outlook Account Connected",
        description: "Successfully connected to your Microsoft Outlook account!",
      })
      setActiveTab('connections')
      router.replace(router.pathname, undefined, { shallow: true })
    }

    if (router.query.onedrive_connected === 'true') {
      toast({
        title: "OneDrive Account Connected",
        description: "Successfully connected to your Microsoft OneDrive account!",
      })
      setActiveTab('connections')
      router.replace(router.pathname, undefined, { shallow: true })
    }

    if (router.query.settingsTab) {
      setActiveTab(String(router.query.settingsTab))
      const { settingsTab, ...rest } = router.query
      router.replace({ pathname: router.pathname, query: rest }, undefined, { shallow: true })
    }
  }, [router.query.scopeActivated, router.query.x_connected, router.query.outlook_connected, router.query.onedrive_connected, router.query.settingsTab])

  async function loadUserInfo() {
    try {
      const username = localStorage.getItem('username')
      const email = localStorage.getItem('userEmail')
      setUserInfo({
        username: username || 'Unknown',
        email: email || 'Not provided',
        first_name: 'Not provided',
        last_name: 'Not provided'
      })

      await loadSubscriptionStatus()
    } catch (error) {
      console.error('Error loading user info:', error)
    }
  }

  async function updateProfile(data: { first_name: string; last_name: string; email: string }) {
    const result = await handleUpdateProfile(data, (updatedData) => {
      // Update local state with new data
      setUserInfo(prev => prev ? ({
        ...prev,
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email
      }) : null)
    })
    
    return result
  }

  async function loadSubscriptionStatus() {
    try {
      const status = await checkPaymentStatus()
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Error loading subscription status:', error)
      setSubscriptionStatus({
        subscription: 'free',
        payment_status: 'unknown',
        payment_succeeded: false
      })
    }
  }

  async function handleProSubscription() {
    setSubscriptionLoading(true)
    try {
      const token = localStorage.getItem('authToken')
      if (!token) {
        throw new Error('Please log in to subscribe')
      }

      const response = await ApiService.post<PaymentIntentResponse>('/billing/create-payment-intent/', {
        amount: 1000,
      })

      if (response.clientSecret) {
        setClientSecret(response.clientSecret)
        setShowCheckout(true)
      }
    } catch (error) {
      console.error('Error creating subscription:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start checkout",
        variant: "destructive",
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  function handleCheckoutSuccess() {
    setShowCheckout(false)
    setClientSecret(null)
    toast({
      title: "Success!",
      description: "Welcome to Banbury Pro!",
    })
    loadSubscriptionStatus()
  }

  function handleCheckoutCancel() {
    setShowCheckout(false)
    setClientSecret(null)
  }

  async function handleCancelSubscription() {
    setCancelLoading(true)
    try {
      await ApiService.post('/billing/cancel-subscription/', {})
      
      toast({
        title: "Subscription Canceled",
        description: "Your subscription has been canceled successfully.",
      })
      
      setShowCancelModal(false)
      await loadSubscriptionStatus()
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel subscription",
        variant: "destructive",
      })
    } finally {
      setCancelLoading(false)
    }
  }

  function handleThemeToggle(checked: boolean) {
    setIsDarkMode(checked)
    setTheme(checked ? 'dark' : 'light')
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogPortal>
          <DialogOverlay className="bg-background/60 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 h-[92vh] w-[calc(100vw-1.5rem)] max-w-5xl translate-x-[-50%] translate-y-[-50%] overflow-hidden border border-border bg-popover shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:h-[82vh] sm:rounded-lg">
          <div className="flex h-full flex-col md:flex-row">
            <div className="border-b border-border bg-popover p-4 md:w-64 md:border-b-0 md:border-r md:p-6">
              <DialogHeader className="mb-4 md:mb-6">
                <DialogTitle className="text-xl font-bold text-foreground">
                  <Typography variant="h2">Settings</Typography>
                </DialogTitle>
              </DialogHeader>
              <nav className="flex gap-2 overflow-x-auto pb-1 md:block md:space-y-2 md:overflow-x-visible md:pb-0" aria-label="Settings sections">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon
                  const isActive = activeTab === tab.id
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setActiveTab(tab.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={cn(
                        'flex min-w-fit items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:w-full',
                        isActive
                          ? 'bg-muted text-foreground'
                          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0" />
                      <div className="min-w-0 flex-1 whitespace-nowrap">
                        <Typography variant="small">{tab.label}</Typography>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            <div className="flex-1 overflow-y-auto bg-popover p-5 sm:p-6 md:p-8">
              {activeTab === 'profile' && (
                <ProfileTab 
                  scopeActivated={scopeActivated}
                  userInfo={userInfo}
                  onUpdateProfile={updateProfile}
                />
              )}

              {activeTab === 'appearance' && (
                <AppearanceTab 
                  isDarkMode={isDarkMode}
                  onThemeToggle={handleThemeToggle}
                />
              )}

              {activeTab === 'keybinds' && (
                <KeybindsTab />
              )}

              {activeTab === 'ai-settings' && (
                <AISettingsTab />
              )}

              {activeTab === 'meeting-agent' && (
                <MeetingAgentTab />
              )}

              {activeTab === 'subscription' && (
                <SubscriptionTab 
                  subscriptionStatus={subscriptionStatus}
                  subscriptionLoading={subscriptionLoading}
                  onUpgradeToPro={handleProSubscription}
                  onCancelSubscription={() => setShowCancelModal(true)}
                />
              )}

              {activeTab === 'connections' && (
                <ConnectionsTab />
              )}

              {activeTab === 'usage' && (
                <UsageTab />
              )}

              {activeTab === 'about' && (
                <AboutTab />
              )}
            </div>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-80 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Checkout Modal */}
      {showCheckout && clientSecret && (
        <Dialog open={showCheckout} onOpenChange={() => setShowCheckout(false)}>
          <DialogPortal>
            <DialogOverlay className="bg-background/60 backdrop-blur-sm" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-1.5rem)] max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
            <div className="mb-4">
              <Typography variant="h3" className="text-foreground">Subscribe to Pro</Typography>
            </div>
            
            <Elements 
              stripe={stripePromise} 
              options={{ 
                clientSecret,
                appearance: {
                  theme: 'night',
                }
              }}
            >
              <CheckoutForm 
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
              />
            </Elements>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-80 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}

      {/* Cancel Subscription Modal */}
      {showCancelModal && (
        <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
          <DialogPortal>
            <DialogOverlay className="bg-background/60 backdrop-blur-sm" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100vw-1.5rem)] max-w-md translate-x-[-50%] translate-y-[-50%] border border-border bg-card p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg">
            <div className="mb-4">
              <Typography variant="h3" className="flex items-center gap-3 text-foreground">
                <XCircle className="h-6 w-6 text-destructive" />
                Cancel Subscription
              </Typography>
            </div>
            
            <div className="space-y-4">
              <Typography variant="p" className="text-muted-foreground">
                Are you sure you want to cancel your Pro subscription?
              </Typography>
              <div className="rounded-lg border border-border bg-muted/50 p-4">
                <Typography variant="h4" className="mb-2 text-foreground">You will lose access to:</Typography>
                <ul className="space-y-1">
                  <li>
                    <Typography variant="small" className="text-muted-foreground">Unlimited storage</Typography>
                  </li>
                  <li>
                    <Typography variant="small" className="text-muted-foreground">Unlimited AI requests</Typography>
                  </li>
                  <li>
                    <Typography variant="small" className="text-muted-foreground">Priority support</Typography>
                  </li>
                </ul>
              </div>
              <Typography variant="small" className="text-muted-foreground">
                Your subscription will remain active until the end of your current billing period.
              </Typography>
            </div>
            
            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row">
              <Button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                variant="destructive"
                className="flex-1"
              >
                {cancelLoading ? 'Canceling...' : 'Yes, Cancel Subscription'}
              </Button>
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
              >
                Keep Subscription
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground opacity-80 transition-opacity hover:bg-muted hover:text-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring">
              <X className="h-4 w-4" />
              <span className="sr-only">Close</span>
            </DialogPrimitive.Close>
          </DialogPrimitive.Content>
          </DialogPortal>
        </Dialog>
      )}
      
      <Toaster />
    </>
  )
}

