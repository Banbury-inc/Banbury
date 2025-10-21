import { useState, useEffect } from 'react'
import { useRouter } from 'next/router'
import { 
  Settings as SettingsIcon, 
  User, 
  Mail, 
  FolderOpen, 
  Calendar,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Link,
  CreditCard,
  Crown,
  XCircle,
  Trash2
} from 'lucide-react'

import { Button } from '../components/ui/button'
import { ScopeManager } from '../components/modals/settings-tabs/ScopeManager'
import { XApiConnection } from '../components/modals/settings-tabs/XApiConnection'
import { SlackConnection } from '../components/modals/settings-tabs/SlackConnection'
import { ApiService } from '../services/apiService'
import { NavSidebar } from '../components/nav-sidebar'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { useToast } from '../components/ui/use-toast'
import { Toaster } from '../components/ui/toaster'

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51PGNdQJ2FLdDk2RmRpHZE9kX2yHJ9rIiVr5t8JfmV5eB1LyazU2uei7Qe0GdkpTnsMOz69w6hPNsU3KDmbUxyGOx00WxE03DQP')

// Helper function to get user information from localStorage
function getUserInfo() {
  if (typeof window === 'undefined') return null;
  
  const userEmail = localStorage.getItem('userEmail');
  const username = localStorage.getItem('username');
  
  return {
    email: userEmail || '',
    name: username || ''
  };
}

// Helper function to verify payment success with backend
async function verifyPaymentSuccess(paymentIntentId: string) {
  try {
    const response = await ApiService.post('/billing/verify-payment-intent/', {
      payment_intent_id: paymentIntentId
    }) as any;
    
    if (response.payment_succeeded) {
      console.log('Payment verified successfully:', response);
      return response;
    } else {
      throw new Error('Payment not successful');
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw error;
  }
}

// Helper function to check payment status
async function checkPaymentStatus() {
  try {
    const response = await ApiService.get('/billing/check-payment-status/') as any;
    return response;
  } catch (error) {
    console.error('Error checking payment status:', error);
    throw error;
  }
}

// Checkout Form Component
function CheckoutForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentElementReady, setPaymentElementReady] = useState(false);
  const [userInfo, setUserInfo] = useState(getUserInfo());

  // Update user info when component mounts or localStorage changes
  useEffect(() => {
    const info = getUserInfo();
    setUserInfo(info);
    
    // Listen for storage changes (in case user info is updated elsewhere)
    const handleStorageChange = () => {
      const updatedInfo = getUserInfo();
      setUserInfo(updatedInfo);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Confirm the payment
      const { error: submitError } = await elements.submit();
      if (submitError) {
        setError(submitError.message || 'Payment failed');
        setIsLoading(false);
        return;
      }

      // The subscription was already created, just confirm the payment
      const { error: confirmError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/settings?success=true`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      } else {
        // Payment confirmed, subscription will be activated via webhook
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message || 'Payment failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-zinc-800 rounded-lg p-4">
        <PaymentElement 
          options={{
            layout: {
              type: 'accordion',
              defaultCollapsed: false,
              radios: true,
              spacedAccordionItems: true
            },
            defaultValues: {
              billingDetails: {
                name: userInfo?.name || '',
                email: userInfo?.email || ''
              }
            },
            fields: {
              billingDetails: {
                name: userInfo?.name ? 'auto' : 'never',
                email: userInfo?.email ? 'auto' : 'never',
                phone: 'auto',
                address: 'auto'
              }
            },
            wallets: {
              applePay: 'auto',
              googlePay: 'auto'
            }
          }}
          onReady={() => setPaymentElementReady(true)}
        />
      </div>
      
      {error && (
        <div className="bg-red-900 border border-red-700 text-red-100 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
      
      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || !paymentElementReady || isLoading}
          className="flex-1 bg-white hover:bg-zinc-300"
        >
          {isLoading ? 'Processing...' : 'Subscribe to Pro - $10/month'}
        </Button>
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="border-zinc-300 bg-zinc-800 text-zinc-300 hover:bg-zinc-800"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

const Settings = (): JSX.Element => {
  const router = useRouter()
  const { toast } = useToast()
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

  const settingsTabs = [
    {
      id: 'profile',
      label: 'Profile',
      icon: User,
      description: 'Manage your account information'
    },
    {
      id: 'connections',
      label: 'Connections',
      icon: Link,
      description: 'Manage your Google integrations'
    },
    {
      id: 'subscription',
      label: 'Subscription',
      icon: CreditCard,
      description: 'Manage your subscription plan'
    },
  ]

  useEffect(() => {
    // Check if user just activated a scope
    if (router.query.scopeActivated === 'true') {
      setScopeActivated(true)
      // Remove the query parameter
      router.replace('/settings', undefined, { shallow: true })
    }

    // Check if X connection was successful
    if (router.query.x_connected === 'true') {
      toast({
        title: "X Account Connected",
        description: "Successfully connected to your X account!",
      })
      // Remove the query parameter
      router.replace('/settings', undefined, { shallow: true })
    }

    // Check if Slack connection was successful
    if (router.query.slack_connected === 'true') {
      toast({
        title: "Slack Workspace Connected",
        description: "Successfully connected to your Slack workspace!",
      })
      setActiveTab('connections')
      // Remove the query parameter
      router.replace('/settings', undefined, { shallow: true })
    }

    loadUserInfo()
  }, [router.query.scopeActivated, router.query.x_connected])

  const loadUserInfo = async () => {
    try {
      setLoading(true)
      // Get username from localStorage for now
      const username = localStorage.getItem('username')
      const email = localStorage.getItem('userEmail')
      setUserInfo({
        username: username || 'Unknown',
        email: email || 'Not provided',
        first_name: 'Not provided',
        last_name: 'Not provided'
      })

      // Load subscription status
      await loadSubscriptionStatus()
    } catch (error) {
      console.error('Error loading user info:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadSubscriptionStatus = async () => {
    try {
      const status = await checkPaymentStatus()
      setSubscriptionStatus(status)
    } catch (error) {
      console.error('Error loading subscription status:', error)
      // Set default status if API call fails
      setSubscriptionStatus({
        subscription: 'free',
        payment_status: 'unknown',
        payment_succeeded: false
      })
    }
  }

  const handleProSubscription = async () => {
    setSubscriptionLoading(true)
    try {
      // Get auth token
      const token = localStorage.getItem('authToken')
      if (!token) {
        // Redirect to login if not authenticated
        window.location.href = '/login'
        return
      }

      // Create subscription intent
      const response = await ApiService.post('/billing/create-subscription-intent/', {
        price_id: 'price_1S0n4iJ2FLdDk2Rmlmd1gdcI'
      }) as any

      if (response.client_secret) {
        // Payment required - show checkout form
        setClientSecret(response.client_secret)
        setShowCheckout(true)
      } else if (response.status === 'active') {
        // Subscription activated without payment (free trial, etc.)
        await loadSubscriptionStatus()
        toast({
          title: "Subscription activated successfully",
          description: "Your Pro subscription is now active!",
          variant: "success",
        })
      } else {
        // Subscription created but needs payment method to be attached
        toast({
          title: "Subscription created",
          description: "Please add a payment method to activate your subscription.",
          variant: "default",
        })
        await loadSubscriptionStatus()
      }
    } catch (error) {
      console.error('Error creating payment intent:', error)
      toast({
        title: "Failed to start checkout",
        description: "There was an error starting the checkout process. Please try again.",
        variant: "destructive",
      })
    } finally {
      setSubscriptionLoading(false)
    }
  }

  const handleCheckoutSuccess = async () => {
    try {
      // Check payment status one more time to ensure everything is updated
      const paymentStatus = await checkPaymentStatus()
      console.log('Final payment status:', paymentStatus)
      
      setShowCheckout(false)
      setClientSecret(null)
      
      // Reload subscription status
      await loadSubscriptionStatus()
      
      // Show success message
      toast({
        title: "Subscription activated successfully",
        description: "Your Pro subscription is now active and ready to use!",
        variant: "success",
      })
    } catch (error) {
      console.error('Error during success handling:', error)
      // Still close checkout and reload status
      setShowCheckout(false)
      setClientSecret(null)
      await loadSubscriptionStatus()
    }
  }

  const handleCheckoutCancel = () => {
    setShowCheckout(false)
    setClientSecret(null)
  }

  const handleCancelSubscription = async () => {
    setCancelLoading(true)
    try {
      const response = await ApiService.post('/billing/cancel-subscription/', {}) as any
      
      if (response.status === 'canceled' || response.message.includes('canceled')) {
        // Reload subscription status to reflect cancellation
        await loadSubscriptionStatus()
        setShowCancelModal(false)
        toast({
          title: "Subscription canceled successfully",
          description: "You will continue to have access until the end of your billing period.",
          variant: "success",
        })
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error: any) {
      console.error('Error canceling subscription:', error)
      toast({
        title: "Failed to cancel subscription",
        description: error.message || "There was an error canceling your subscription. Please try again.",
        variant: "destructive",
      })
    } finally {
      setCancelLoading(false)
    }
  }

  const handleLogout = () => {
    // Clear all authentication data using ApiService
    ApiService.clearAuthToken();
    
    // Clear any additional session data
    localStorage.removeItem('deviceId');
    localStorage.removeItem('googleOAuthSession');
    localStorage.removeItem('userData');
    
    // Redirect to home page
    router.push('/');
  };

  if (loading) {
    return (
      <div className="flex h-screen bg-black">
        <NavSidebar onLogout={handleLogout} />
        <div className="flex-1 ml-16 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    )
  }

    return (
    <div className="flex h-screen bg-black">
      <NavSidebar onLogout={handleLogout} />
      <div className="flex-1 ml-16 flex">
        {/* Settings Sidebar */}
        <div className="w-64 bg-black border-r border-zinc-700 p-4">
          <h2 className="text-white text-lg font-semibold mb-6">Settings</h2>
          <nav className="space-y-2">
            {settingsTabs.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors ${
                    activeTab === tab.id
                      ? 'bg-zinc-800 text-white'
                      : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <div>
                    <div className="font-medium">{tab.label}</div>
                    <div className="text-xs text-zinc-500">{tab.description}</div>
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8 overflow-y-auto min-h-0">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white">
              {settingsTabs.find(tab => tab.id === activeTab)?.label}
            </h1>
            <p className="text-gray-400">
              {settingsTabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>

                  {/* Tab Content */}
          {activeTab === 'profile' && (
            <div className="space-y-6">
              {/* Scope Activation Success Message */}
              {scopeActivated && (
                <div className="p-4 bg-green-900/20 border border-green-700 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-400 mr-2" />
                    <span className="text-green-400">
                      Google integration features activated successfully!
                    </span>
                  </div>
                </div>
              )}

              {/* User Info */}
              {userInfo && (
                <div className="p-6 bg-zinc-900 rounded-lg">
                  <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                    <User className="h-5 w-5 mr-2" />
                    Account Information
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-gray-400">Username</label>
                      <p className="text-white">{userInfo.username}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Email</label>
                      <p className="text-white">{userInfo.email || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">First Name</label>
                      <p className="text-white">{userInfo.first_name || 'Not provided'}</p>
                    </div>
                    <div>
                      <label className="text-sm text-gray-400">Last Name</label>
                      <p className="text-white">{userInfo.last_name || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'subscription' && (
            <div className="space-y-6">
              {/* Checkout Modal */}
              {showCheckout && clientSecret && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-semibold text-white">Subscribe to Pro</h3>
                      <button
                        onClick={handleCheckoutCancel}
                        className="text-zinc-400 hover:text-white"
                      >
                        ×
                      </button>
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
                  </div>
                </div>
              )}

              {/* Cancel Subscription Modal */}
              {showCancelModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-6 w-full max-w-md">
                    <div className="flex items-center gap-3 mb-4">
                      <XCircle className="h-6 w-6 text-red-400" />
                      <h3 className="text-xl font-semibold text-white">Cancel Subscription</h3>
                    </div>
                    
                    <div className="mb-6">
                      <p className="text-zinc-300 mb-3">
                        Are you sure you want to cancel your Pro subscription?
                      </p>
                      <div className="bg-zinc-800 rounded-lg p-4 mb-4">
                        <h4 className="text-white font-medium mb-2">You will lose access to:</h4>
                        <ul className="space-y-1 text-zinc-400 text-sm">
                          <li>• Unlimited storage</li>
                          <li>• Unlimited AI requests</li>
                          <li>• Priority support</li>
                        </ul>
                      </div>
                      <p className="text-zinc-400 text-sm">
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
                        className="border-zinc-600 text-zinc-300 hover:bg-zinc-800"
                      >
                        Keep Subscription
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Current Subscription Status */}
              <div className="bg-zinc-900 rounded-xl border border-zinc-700">
                {subscriptionStatus ? (
                  <>
                    {/* Header Section */}
                    <div className="p-6 border-b border-zinc-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div>
                            <h2 className="text-2xl font-bold text-white">
                              {subscriptionStatus.subscription === 'pro' ? 'Pro' : 'Free'}
                            </h2>
                            {subscriptionStatus.subscription === 'pro' && subscriptionStatus.payment_succeeded_at && (
                              <p className="text-zinc-400 text-sm mt-1">
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
                          <div className="text-3xl font-bold text-white">
                            {subscriptionStatus.subscription === 'pro' ? '$10' : '$0'}
                          </div>
                          <div className="text-zinc-400 text-sm">per month</div>
                        </div>
                      </div>
                    </div>

                    {/* Features Section */}
                    <div className="p-6">
                      {subscriptionStatus.subscription === 'pro' ? (
                        <div>
                          <p className="text-zinc-300 mb-4">
                            Thanks for subscribing to Banbury Pro! Your Pro plan includes:
                          </p>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Everything in Free</p>
                                <p className="text-zinc-400 text-sm">All basic features included</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Unlimited storage</p>
                                <p className="text-zinc-400 text-sm">Store unlimited files and documents</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Unlimited AI requests</p>
                                <p className="text-zinc-400 text-sm">No limits on AI assistant interactions</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Advanced file processing</p>
                                <p className="text-zinc-400 text-sm">Enhanced upload limits and processing capabilities</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Priority support</p>
                                <p className="text-zinc-400 text-sm">24/7 dedicated customer support</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Early access to new features</p>
                                <p className="text-zinc-400 text-sm">Be the first to try new capabilities and improvements</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <p className="text-zinc-300 mb-4">
                            You're currently on the Free plan. Your plan includes:
                          </p>
                          
                          <div className="space-y-3">
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Core features</p>
                                <p className="text-zinc-400 text-sm">Essential functionality included</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">10 GB storage</p>
                                <p className="text-zinc-400 text-sm">Store your important files and documents</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">100 AI requests</p>
                                <p className="text-zinc-400 text-sm">Get started with AI assistance</p>
                              </div>
                            </div>
                            
                            <div className="flex items-start gap-3">
                              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="text-white font-medium">Community support</p>
                                <p className="text-zinc-400 text-sm">Access to help documentation and community</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                                              {/* Status and Actions */}
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
                    <div className="flex items-center text-zinc-400">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-400 mr-3"></div>
                      Loading subscription information...
                    </div>
                  </div>
                )}
              </div>

              {/* Upgrade to Pro */}
              {subscriptionStatus?.subscription !== 'pro' && (
                <div className="p-6 bg-zinc-900 rounded-lg border border-zinc-700">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <h3 className="text-lg font-semibold text-white">Upgrade to Pro</h3>
                      </div>
                      <p className="text-zinc-400 mb-4">
                        Get unlimited storage, unlimited AI requests, and priority support.
                      </p>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Unlimited Storage</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle className="h-4 w-4 text-green-400" />
                          <span>Unlimited AI Requests</span>
                        </div>
                        <div className="flex items-center gap-2 text-zinc-300">
                          <CheckCircle className="h-4 w-4 text-green-400" />
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
              {/* Google Integration */}
              <div className="p-6 bg-zinc-900 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Link className="h-5 w-5 mr-2" />
                  Google Integration
                </h2>
                <ScopeManager 
                  onFeatureActivated={(feature) => {
                    console.log(`Feature activated: ${feature}`)
                    // You could show a success message or refresh the page
                  }}
                />
              </div>

              {/* Slack Integration */}
              <div className="p-6 bg-zinc-900 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Link className="h-5 w-5 mr-2" />
                  Slack Integration
                </h2>
                <SlackConnection />
              </div>

              {/* X API Integration */}
              <div className="p-6 bg-zinc-900 rounded-lg">
                <h2 className="text-lg font-semibold mb-4 flex items-center text-white">
                  <Link className="h-5 w-5 mr-2" />
                  X (Twitter) Integration
                </h2>
                <XApiConnection />
              </div>

            </div>
          )}


        </div>
      </div>
      <Toaster />
    </div>
  )
}

export default Settings
