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
      <Typography variant="h3" className="mb-4 flex items-center text-foreground">
        <Crown className="h-5 w-5 mr-2" />
        Subscription
      </Typography>
      <Separator />

      {subscriptionStatus ? (
        <>
          {/* Current Plan Section */}
          <div className="space-y-4">
            <div>
              <Typography variant="small" className="text-muted-foreground">Current Plan</Typography>
              <div className="flex items-center justify-between mt-1">
                <Typography variant="large" className="text-foreground">
                  {subscriptionStatus.subscription === 'pro' ? 'Pro' : 'Free'}
                </Typography>
                <div className="text-foreground">
                  <Typography variant="large" className="inline">
                    {subscriptionStatus.subscription === 'pro' ? '$10' : '$0'}
                  </Typography>
                  <Typography variant="small" className="ml-1 inline text-muted-foreground">
                    /month
                  </Typography>
                </div>
              </div>
              {subscriptionStatus.subscription === 'pro' && subscriptionStatus.payment_succeeded_at && (
                <Typography variant="small" className="mt-1 text-muted-foreground">
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
            <Typography variant="small" className="text-muted-foreground">
              {subscriptionStatus.subscription === 'pro' ? 'Your Pro Benefits' : 'Free Plan Features'}
            </Typography>
            
            {subscriptionStatus.subscription === 'pro' ? (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">Everything in Free</Typography>
                    <Typography variant="small" className="text-muted-foreground">All basic features included</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">Unlimited storage</Typography>
                    <Typography variant="small" className="text-muted-foreground">Store unlimited files and documents</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">Unlimited AI requests</Typography>
                    <Typography variant="small" className="text-muted-foreground">No limits on AI assistance</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">24/7 Priority support</Typography>
                    <Typography variant="small" className="text-muted-foreground">Get help when you need it</Typography>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">10 GB storage</Typography>
                    <Typography variant="small" className="text-muted-foreground">Store your important files and documents</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">100 AI requests</Typography>
                    <Typography variant="small" className="text-muted-foreground">Get started with AI assistance</Typography>
                  </div>
                </div>
                
                <div className="flex items-start gap-3">
                  <CheckCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-primary" />
                  <div>
                    <Typography variant="p" className="font-medium text-foreground">Community support</Typography>
                    <Typography variant="small" className="text-muted-foreground">Access to help documentation and community</Typography>
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
                  <Crown className="h-5 w-5 text-primary" />
                  <Typography variant="h3" className="text-foreground">Upgrade to Pro</Typography>
                </div>
                <Typography variant="p" className="text-muted-foreground">
                  Get unlimited storage, unlimited AI requests, and priority support.
                </Typography>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <Typography variant="small" className="text-foreground">Unlimited storage</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <Typography variant="small" className="text-foreground">Unlimited AI requests</Typography>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <Typography variant="small" className="text-foreground">24/7 priority support</Typography>
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
          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-muted-foreground"></div>
          <Typography variant="p" className="text-muted-foreground">Loading subscription information...</Typography>
        </div>
      )}
    </div>
  )
}

