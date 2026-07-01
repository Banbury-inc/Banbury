import { CheckCircle, Trash2 } from 'lucide-react'
import { Button } from '../../common/ui/button'
import { Typography } from '../../common/ui/typography'
import {
  SettingsTabCard,
  SettingsTabCardBody,
  SettingsTabCardFooter,
  SettingsTabHeader,
  SettingsTabLayout,
  SettingsTabLabel,
  SettingsTabSection,
  SettingsTabValueRow,
} from './settings-tab-layout'

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

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <CheckCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
      <SettingsTabLabel label={title} description={description} />
    </div>
  )
}

export function SubscriptionTab({ 
  subscriptionStatus, 
  subscriptionLoading, 
  onUpgradeToPro,
  onCancelSubscription 
}: SubscriptionTabProps) {
  if (!subscriptionStatus) {
    return (
      <SettingsTabLayout>
        <SettingsTabHeader title="Subscription" />
        <div className="flex items-center py-8">
          <div className="mr-3 h-5 w-5 animate-spin rounded-full border-b-2 border-muted-foreground" />
          <Typography variant="small" className="text-muted-foreground">
            Loading subscription information...
          </Typography>
        </div>
      </SettingsTabLayout>
    )
  }

  const isPro = subscriptionStatus.subscription === 'pro'
  const renewDate = subscriptionStatus.payment_succeeded_at
    ? new Date(
        new Date(subscriptionStatus.payment_succeeded_at).setMonth(
          new Date(subscriptionStatus.payment_succeeded_at).getMonth() + 1
        )
      ).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null

  const proFeatures = [
    { title: 'Everything in Free', description: 'All basic features included' },
    { title: 'Unlimited storage', description: 'Store unlimited files and documents' },
    { title: 'Unlimited AI requests', description: 'No limits on AI assistance' },
    { title: '24/7 Priority support', description: 'Get help when you need it' },
  ]

  const freeFeatures = [
    { title: '10 GB storage', description: 'Store your important files and documents' },
    { title: '100 AI requests', description: 'Get started with AI assistance' },
    { title: 'Community support', description: 'Access to help documentation and community' },
  ]

  return (
    <SettingsTabLayout>
      <SettingsTabHeader title="Subscription" />

      <SettingsTabCard>
        <SettingsTabCardBody>
          <SettingsTabValueRow
            label="Current Plan"
            value={isPro ? 'Pro' : 'Free'}
            readOnly
          />
          <SettingsTabValueRow
            label="Price"
            value={isPro ? '$10 / month' : '$0 / month'}
            readOnly
          />
          {isPro && renewDate && (
            <SettingsTabValueRow
              label="Renews"
              value={renewDate}
              readOnly
            />
          )}
        </SettingsTabCardBody>
      </SettingsTabCard>

      <SettingsTabSection title={isPro ? 'Your Pro Benefits' : 'Free Plan Features'}>
        <SettingsTabCard>
          <SettingsTabCardBody>
            {(isPro ? proFeatures : freeFeatures).map((feature) => (
              <FeatureItem key={feature.title} title={feature.title} description={feature.description} />
            ))}
          </SettingsTabCardBody>
        </SettingsTabCard>
      </SettingsTabSection>

      {isPro && (
        <SettingsTabCard className="border-destructive/50">
          <SettingsTabCardFooter className="justify-end">
            <Button onClick={onCancelSubscription} variant="destructive">
              <Trash2 className="mr-2 h-4 w-4" />
              Cancel Subscription
            </Button>
          </SettingsTabCardFooter>
        </SettingsTabCard>
      )}

      {!isPro && (
        <SettingsTabSection title="Upgrade to Pro">
          <Typography variant="small" className="-mt-2 text-muted-foreground">
            Get unlimited storage, unlimited AI requests, and priority support.
          </Typography>
          <SettingsTabCard>
            <SettingsTabCardBody>
              {proFeatures.slice(1).map((feature) => (
                <FeatureItem key={feature.title} title={feature.title} description={feature.description} />
              ))}
            </SettingsTabCardBody>
            <SettingsTabCardFooter>
              <Button
                onClick={onUpgradeToPro}
                disabled={subscriptionLoading}
              >
                {subscriptionLoading ? 'Processing...' : 'Upgrade to Pro - $10/month'}
              </Button>
            </SettingsTabCardFooter>
          </SettingsTabCard>
        </SettingsTabSection>
      )}
    </SettingsTabLayout>
  )
}
