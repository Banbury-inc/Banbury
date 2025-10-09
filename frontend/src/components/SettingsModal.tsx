import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { useTheme } from 'next-themes'
import { 
  User, 
  Link,
  CreditCard,
  Crown,
  XCircle,
  Trash2,
  CheckCircle,
  X,
  Palette,
  Sun,
  Moon,
} from 'lucide-react'

import { Button } from './ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay,
} from './ui/dialog'
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { ScopeManager } from './ScopeManager'
import { XApiConnection } from './XApiConnection'
import { ApiService } from '../services/apiService'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useToast } from './ui/use-toast'
import { Toaster } from './ui/toaster'
import { Switch } from './ui/switch'
import { Typography } from './ui/typography'

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51PGNdQJ2FLdDk2RmRpHZE9kX2yHJ9rIiVr5t8JfmV5eB1LyazU2uei7Qe0GdkpTnsMOz69w6hPNsU3KDmbUxyGOx00WxE03DQP')

interface SettingsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function getUserInfo() {
  if (typeof window === 'undefined') return null
  
  const userEmail = localStorage.getItem('userEmail')
  const username = localStorage.getItem('username')
  
  return {
    email: userEmail || '',
    name: username || ''
  }
}

async function verifyPaymentSuccess(paymentIntentId: string) {
  try {
    const response = await ApiService.post('/billing/verify-payment-intent/', {
      payment_intent_id: paymentIntentId
    }) as any
    
    if (response.payment_succeeded) {
      console.log('Payment verified successfully:', response)
      return response
    } else {
      throw new Error('Payment not successful')
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}

async function checkPaymentStatus() {
  try {
    const response = await ApiService.get('/billing/check-payment-status/') as any
    return response
  } catch (error) {
    console.error('Error checking payment status:', error)
    throw error
  }
}

function CheckoutForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentElementReady, setPaymentElementReady] = useState(false)
  const [userInfo, setUserInfo] = useState(getUserInfo())

  useEffect(() => {
    const info = getUserInfo()
    setUserInfo(info)
    
    const handleStorageChange = () => {
      const updatedInfo = getUserInfo()
      setUserInfo(updatedInfo)
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    
    if (!stripe || !elements) {
      setError('Payment system not loaded')
      return
    }

    if (!paymentElementReady) {
      setError('Payment form not ready. Please wait a moment and try again.')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'An error occurred')
        setIsLoading(false)
        return
      }

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings?payment=success`,
          payment_method_data: {
            billing_details: {
              name: userInfo?.name || undefined,
              email: userInfo?.email || undefined,
            },
          },
        },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
        setIsLoading(false)
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        try {
          await verifyPaymentSuccess(paymentIntent.id)
          onSuccess()
        } catch (verifyError) {
          console.error('Error verifying payment:', verifyError)
          onSuccess()
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement 
        onReady={() => setPaymentElementReady(true)}
        options={{
          layout: 'tabs',
        }}
      />
      
      {error && (
        <div className="p-3 bg-red-900/20 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || !paymentElementReady || isLoading}
          className="flex-1"
        >
          {isLoading ? 'Processing...' : 'Subscribe'}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function SettingsModal({ open, onOpenChange }: SettingsModalProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { theme, setTheme } = useTheme()
  const [loading, setLoading] = useState(true)
  const [userInfo, setUserInfo] = useState<any>(null)
  const [scopeActivated, setScopeActivated] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [showCheckout, setShowCheckout] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [subscriptionStatus, setSubscriptionStatus] = useState<any>(null)
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
      id: 'connections',
      label: 'Connections',
      icon: Link,
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
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
  }, [router.query.scopeActivated, router.query.x_connected])

  async function loadUserInfo() {
    try {
      setLoading(true)
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
    } finally {
      setLoading(false)
    }
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

      const response = await ApiService.post('/billing/create-payment-intent/', {
        amount: 1000,
      }) as any

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
          <DialogOverlay className="bg-black/0 backdrop-blur-sm" />
          <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-4xl h-[80vh] translate-x-[-50%] translate-y-[-50%] border bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg p-0">
          <div className="flex h-full">
            {/* Sidebar */}
            <div className="w-64 border-r border-zinc-300 dark:border-zinc-700 p-6 overflow-y-auto">
              <DialogHeader className="mb-6">
                <DialogTitle className="text-xl font-bold text-zinc-900 dark:text-white">
                  <Typography variant="h2">Settings</Typography>
                </DialogTitle>
              </DialogHeader>
              <nav className="space-y-2">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left ${
                        activeTab === tab.id
                          ? 'bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-white'
                          : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-900 hover:text-zinc-900 dark:hover:text-white'
                      }`}
                    >
                      <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <Typography variant="small">{tab.label}</Typography>
                      </div>
                    </button>
                  )
                })}
              </nav>
            </div>

            {/* Main Content */}
            <div className="flex-1 p-6 overflow-y-auto">
              {/* Tab Content */}
              {activeTab === 'profile' && (
                <div className="space-y-6">
                  {scopeActivated && (
                    <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                        <Typography variant="p" className="text-green-400">
                          Google integration features activated successfully!
                        </Typography>
                      </div>
                    </div>
                  )}

                  {userInfo && (
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                      <h3 className="font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
                        <User className="h-5 w-5 mr-2" />
                        <Typography variant="h3">
                        Account Information
                      </Typography>
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-sm text-zinc-600 dark:text-gray-400">Username</label>
                          <p className="text-zinc-900 dark:text-white">{userInfo.username}</p>
                        </div>
                        <div>
                          <label className="text-sm text-zinc-600 dark:text-gray-400">Email</label>
                          <p className="text-zinc-900 dark:text-white">{userInfo.email || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-zinc-600 dark:text-gray-400">First Name</label>
                          <p className="text-zinc-900 dark:text-white">{userInfo.first_name || 'Not provided'}</p>
                        </div>
                        <div>
                          <label className="text-sm text-zinc-600 dark:text-gray-400">Last Name</label>
                          <p className="text-zinc-900 dark:text-white">{userInfo.last_name || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'appearance' && (
                <div className="space-y-6">
                  <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
                      <Palette className="h-5 w-5 mr-2" />
                      Theme Settings
                    </h2>
                    
                    <div className="space-y-6">
                      <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-800 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-2 bg-zinc-200 dark:bg-zinc-700 rounded-lg">
                            {isDarkMode ? (
                              <Moon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
                            ) : (
                              <Sun className="h-5 w-5 text-yellow-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-zinc-900 dark:text-white font-medium">Dark Mode</h3>
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                              {isDarkMode ? 'Dark mode is enabled' : 'Light mode is enabled'}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={isDarkMode}
                          onCheckedChange={handleThemeToggle}
                          className="data-[state=checked]:bg-blue-600"
                        />
                      </div>

                      <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
                        <h4 className="text-zinc-900 dark:text-white font-medium mb-3">Preview</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-200 dark:bg-zinc-700 rounded border border-zinc-300 dark:border-zinc-600">
                            <div className="text-zinc-900 dark:text-white text-sm font-medium mb-1">Background</div>
                            <div className="text-zinc-600 dark:text-zinc-400 text-xs">Primary surface color</div>
                          </div>
                          <div className="p-3 bg-zinc-100 dark:bg-zinc-800 rounded border border-zinc-300 dark:border-zinc-600">
                            <div className="text-zinc-900 dark:text-white text-sm font-medium mb-1">Surface</div>
                            <div className="text-zinc-600 dark:text-zinc-400 text-xs">Secondary surface color</div>
                          </div>
                          <div className="p-3 bg-blue-600 rounded">
                            <div className="text-white text-sm font-medium mb-1">Primary</div>
                            <div className="text-blue-100 text-xs">Accent color</div>
                          </div>
                          <div className="p-3 bg-zinc-200 dark:bg-zinc-700 rounded border border-zinc-300 dark:border-zinc-600">
                            <div className="text-zinc-900 dark:text-white text-sm font-medium mb-1">Text</div>
                            <div className="text-zinc-600 dark:text-zinc-400 text-xs">Text colors</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'subscription' && (
                <div className="space-y-6">
                  {/* Current Subscription Status */}
                  <div className="bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-300 dark:border-zinc-700">
                    {subscriptionStatus ? (
                      <>
                        <div className="p-6 border-b border-zinc-300 dark:border-zinc-700">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div>
                                <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
                                  {subscriptionStatus.subscription === 'pro' ? 'Pro' : 'Free'}
                                </h2>
                                {subscriptionStatus.subscription === 'pro' && subscriptionStatus.payment_succeeded_at && (
                                  <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                                    Your plan auto-renews on {new Date(new Date(subscriptionStatus.payment_succeeded_at).setMonth(new Date(subscriptionStatus.payment_succeeded_at).getMonth() + 1)).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </p>
                                )}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-3xl font-bold text-zinc-900 dark:text-white">
                                {subscriptionStatus.subscription === 'pro' ? '$10' : '$0'}
                              </div>
                              <div className="text-zinc-600 dark:text-zinc-400 text-sm">per month</div>
                            </div>
                          </div>
                        </div>

                        <div className="p-6">
                          {subscriptionStatus.subscription === 'pro' ? (
                            <div>
                              <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                                Thanks for subscribing to Banbury Pro! Your Pro plan includes:
                              </p>
                              
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">Everything in Free</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">All basic features included</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">Unlimited storage</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Store unlimited files and documents</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">Unlimited AI requests</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">No limits on AI assistance</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">24/7 Priority support</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Get help when you need it</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <p className="text-zinc-700 dark:text-zinc-300 mb-4">
                                You are currently on the Free plan. Your plan includes:
                              </p>
                              
                              <div className="space-y-3">
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">10 GB storage</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Store your important files and documents</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">100 AI requests</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Get started with AI assistance</p>
                                  </div>
                                </div>
                                
                                <div className="flex items-start gap-3">
                                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                                  <div>
                                    <p className="text-zinc-900 dark:text-white font-medium">Community support</p>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">Access to help documentation and community</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="mt-6 pt-6 flex items-center justify-end">
                            {subscriptionStatus.subscription === 'pro' && (
                              <Button
                                onClick={() => setShowCancelModal(true)}
                                variant="outline"
                                size="sm"
                                className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Cancel Subscription
                              </Button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="p-6 flex items-center justify-center">
                        <div className="flex items-center text-zinc-600 dark:text-zinc-400">
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-600 dark:border-zinc-400 mr-3"></div>
                          Loading subscription information...
                        </div>
                      </div>
                    )}
                  </div>

                  {subscriptionStatus?.subscription !== 'pro' && (
                    <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg border border-zinc-300 dark:border-zinc-700">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Crown className="h-5 w-5 text-yellow-500" />
                            <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Upgrade to Pro</h3>
                          </div>
                          <p className="text-zinc-600 dark:text-zinc-400 mb-4">
                            Get unlimited storage, unlimited AI requests, and priority support.
                          </p>
                          
                          <div className="space-y-2 mb-4">
                            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-300">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span>Unlimited Storage</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-300">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span>Unlimited AI Requests</span>
                            </div>
                            <div className="flex items-center gap-2 text-zinc-800 dark:text-zinc-300">
                              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                              <span>24/7 Priority Support</span>
                            </div>
                          </div>
                          
                          <Button 
                            onClick={handleProSubscription}
                            disabled={subscriptionLoading}
                          >
                            {subscriptionLoading ? 'Processing...' : 'Upgrade to Pro - $10/month'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'connections' && (
                <div className="space-y-8">
                  <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
                      <Link className="h-5 w-5 mr-2" />
                      Google Integration
                    </h2>
                    <ScopeManager 
                      onFeatureActivated={(feature) => {
                        console.log(`Feature activated: ${feature}`)
                      }}
                    />
                  </div>

                  <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-lg">
                    <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
                      <Link className="h-5 w-5 mr-2" />
                      X (Twitter) Integration
                    </h2>
                    <XApiConnection />
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4 text-zinc-900 dark:text-white" />
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
        </DialogPortal>
      </Dialog>

      {/* Checkout Modal */}
      {showCheckout && clientSecret && (
        <Dialog open={showCheckout} onOpenChange={() => setShowCheckout(false)}>
          <DialogPortal>
            <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-xl font-semibold text-zinc-900 dark:text-white">Subscribe to Pro</h3>
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
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4 text-zinc-900 dark:text-white" />
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
            <DialogOverlay className="bg-black/30 backdrop-blur-sm" />
            <DialogPrimitive.Content className="fixed left-[50%] top-[50%] z-50 w-full max-w-md translate-x-[-50%] translate-y-[-50%] border bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 sm:rounded-lg p-6">
            <div className="mb-4">
              <h3 className="flex items-center gap-3 text-zinc-900 dark:text-white text-xl font-semibold">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                Cancel Subscription
              </h3>
            </div>
            
            <div className="space-y-4">
              <p className="text-zinc-700 dark:text-zinc-300">
                Are you sure you want to cancel your Pro subscription?
              </p>
              <div className="bg-zinc-100 dark:bg-zinc-800 rounded-lg p-4">
                <h4 className="text-zinc-900 dark:text-white font-medium mb-2">You will lose access to:</h4>
                <ul className="space-y-1 text-zinc-700 dark:text-zinc-400 text-sm">
                  <li>• Unlimited storage</li>
                  <li>• Unlimited AI requests</li>
                  <li>• Priority support</li>
                </ul>
              </div>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                Your subscription will remain active until the end of your current billing period.
              </p>
            </div>
            
            <div className="flex gap-3">
              <Button
                onClick={handleCancelSubscription}
                disabled={cancelLoading}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelLoading ? 'Canceling...' : 'Yes, Cancel Subscription'}
              </Button>
              <Button
                onClick={() => setShowCancelModal(false)}
                variant="outline"
                className="border-zinc-400 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                Keep Subscription
              </Button>
            </div>
            <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none">
              <X className="h-4 w-4 text-zinc-900 dark:text-white" />
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

