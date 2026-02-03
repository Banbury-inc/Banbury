import { CheckCircle, Crown, Trash2 } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Separator } from '../../common/ui/separator'
import { Typography } from '../../common/ui/typography'

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
      <Typography variant="h3" className="mb-4 flex items-center text-zinc-900 dark:text-white">
        <Crown className="h-5 w-5 mr-2" />
        Subscription
      </Typography>
      <Separator />

      {subscriptionStatus ? (
        <>
          {/* Current Plan Section */}
          <div className="space-y-4">
            <div>
              <Typography variant="small" className="text-zinc-600 dark:text-gray-400">Current Plan</Typography>
              <div className="flex items-center justify-between mt-1">
                <Typography variant="large" className="text-zinc-900 dark:text-white">
                  {subscriptionStatus.subscription === 'pro' ? 'Pro' : 'Free'}
                </Typography>
                <div className="text-zinc-900 dark:text-white">
                  <Typography variant="large" className="inline">
                    {subscriptionStatus.subscription === 'pro' ? '$10' : '$0'}
                  </Typography>
                  <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 inline ml-1">
                    /month
                  </Typography>
                </div>
              </div>
              {subscriptionStatus.subscription === 'pro' && subscriptionStatus.payment_succeeded_at && (
                <Typography variant="small" className="text-zinc-600 dark:text-zinc-400 mt-1">
                  Auto-renews on {new Date(new Date(subscriptionStatus.payment_succeeded_at).setMonth(new Date(subscriptionStatus.payment_succeeded_at).getMonth() + 1)).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
              )}
            </div>
          </div>

          <Separator />

          {/* Features Section */}
          <div className="space-y-4">
            <Typography variant="small" className="text-zinc-600 dark:text-gray-400">
              {subscriptionStatus.subscription === 'pro' ? 'Your Pro Benefits' : 'Free Plan Features'}
            </Typography>
            
            {subscriptionStatus.subscription === 'pro' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">Everything in Free</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">All basic features included</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">Unlimited storage</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">Store unlimited files and documents</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">Unlimited AI requests</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">No limits on AI assistance</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">24/7 Priority support</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">Get help when you need it</Typography>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">10 GB storage</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">Store your important files and documents</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">100 AI requests</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">Get started with AI assistance</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <Typography variant="p" className="text-zinc-900 dark:text-white font-medium">Community support</Typography>
                    <Typography variant="small" className="text-zinc-600 dark:text-zinc-400">Access to help documentation and community</Typography>
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
                  <Typography variant="h3" className="text-zinc-900 dark:text-white">Upgrade to Pro</Typography>
                </div>
                <Typography variant="p" className="text-zinc-600 dark:text-zinc-400">
                  Get unlimited storage, unlimited AI requests, and priority support.
                </Typography>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <Typography variant="small" className="text-zinc-800 dark:text-zinc-300">Unlimited Storage</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <Typography variant="small" className="text-zinc-800 dark:text-zinc-300">Unlimited AI Requests</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                    <Typography variant="small" className="text-zinc-800 dark:text-zinc-300">24/7 Priority Support</Typography>
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
        <div className="flex items-center">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-zinc-600 dark:border-zinc-400 mr-3"></div>
          <Typography variant="p" className="text-zinc-600 dark:text-zinc-400">Loading subscription information...</Typography>
        </div>
      )}
    </div>
  )
}

