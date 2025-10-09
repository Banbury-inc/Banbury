import { CheckCircle, Crown, Trash2 } from 'lucide-react'
import { Button } from '../../ui/button'
import { Separator } from '../../ui/separator'

interface SubscriptionTabProps {
  subscriptionStatus: {
    subscription: 'pro' | 'free'
    payment_status: string
    payment_succeeded: boolean
    payment_succeeded_at?: string
  } | null
  subscriptionLoading: boolean
  onUpgradeToPro: () => void
  onCancelSubscription: () => void
}

export function SubscriptionTab({ 
  subscriptionStatus, 
  subscriptionLoading, 
  onUpgradeToPro,
  onCancelSubscription 
}: SubscriptionTabProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
        <Crown className="h-5 w-5 mr-2" />
        Subscription
      </h2>
      <Separator />

      {subscriptionStatus ? (
        <>
          {/* Current Plan Section */}
          <div className="space-y-4">
            <div>
              <label className="text-sm text-zinc-600 dark:text-gray-400">Current Plan</label>
              <div className="flex items-center justify-between mt-1">
                <p className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {subscriptionStatus.subscription === 'pro' ? 'Pro' : 'Free'}
                </p>
                <p className="text-xl font-semibold text-zinc-900 dark:text-white">
                  {subscriptionStatus.subscription === 'pro' ? '$10' : '$0'}
                  <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400">/month</span>
                </p>
              </div>
              {subscriptionStatus.subscription === 'pro' && subscriptionStatus.payment_succeeded_at && (
                <p className="text-zinc-600 dark:text-zinc-400 text-sm mt-1">
                  Auto-renews on {new Date(new Date(subscriptionStatus.payment_succeeded_at).setMonth(new Date(subscriptionStatus.payment_succeeded_at).getMonth() + 1)).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Features Section */}
          <div className="space-y-4">
            <label className="text-sm text-zinc-600 dark:text-gray-400">
              {subscriptionStatus.subscription === 'pro' ? 'Your Pro Benefits' : 'Free Plan Features'}
            </label>
            
            {subscriptionStatus.subscription === 'pro' ? (
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
            ) : (
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
            )}
          </div>

          {subscriptionStatus.subscription === 'pro' && (
            <>
              <Separator />
              <div className="flex justify-end">
                <Button
                  onClick={onCancelSubscription}
                  variant="destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Cancel Subscription
                </Button>
              </div>
            </>
          )}

          {subscriptionStatus.subscription !== 'pro' && (
            <>
              <Separator />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-yellow-500" />
                  <h3 className="text-lg font-semibold text-zinc-900 dark:text-white">Upgrade to Pro</h3>
                </div>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Get unlimited storage, unlimited AI requests, and priority support.
                </p>
                
                <div className="space-y-2">
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
                  onClick={onUpgradeToPro}
                  disabled={subscriptionLoading}
                  className="w-full sm:w-auto"
                >
                  {subscriptionLoading ? 'Processing...' : 'Upgrade to Pro - $10/month'}
                </Button>
              </div>
            </>
          )}
        </>
      ) : (
        <div className="flex items-center text-zinc-600 dark:text-zinc-400">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-600 dark:border-zinc-400 mr-3"></div>
          Loading subscription information...
        </div>
      )}
    </div>
  )
}

