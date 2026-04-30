import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

const BILLING_PLANS = [
  {
    title: 'Free',
    price: '$0/month',
    details: ['10 GB storage', '100 AI requests', '24/7 support']
  },
  {
    title: 'Pro',
    price: '$10/month',
    details: ['Everything in Free', 'Unlimited storage', 'Unlimited AI requests', 'Priority support']
  }
]

const ACCESS_STEPS = ['Open the Banbury web app', 'Open the avatar menu', 'Select Settings', 'Go to Subscription']

const CANCELLATION_STEPS = [
  'Go to Settings → Subscription',
  'Select Cancel Subscription',
  'Confirm cancellation'
]

export default function BillingTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Billing
        </Typography>

        <Typography variant="p" className="mb-6">
          This page explains where to manage your subscription, how billing cycles work, what’s included in each plan, and what happens when you cancel.
        </Typography>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">
            Access billing settings
          </Typography>
          <Typography variant="p" className="mb-3">
            You can manage your subscription from within the app:
          </Typography>
          <div className="pl-4">
            {ACCESS_STEPS.map((step, index) => (
              <Typography key={step} variant="p" className={index === ACCESS_STEPS.length - 1 ? undefined : 'mb-1'}>
                {index + 1}. {step}
              </Typography>
            ))}
          </div>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">
            Billing cycles
          </Typography>
          <Typography variant="list">
            <li>Billing is <strong>monthly</strong></li>
            <li>Your subscription <strong>auto-renews monthly</strong> unless you cancel</li>
            <li>Your next renewal date is based on your last successful payment date</li>
          </Typography>
        </div>

        <div className="mb-12">
          <Typography variant="h3" className="mb-2">
            Plans (Free vs Pro)
          </Typography>
          <Typography variant="p" className="mb-3">
            Banbury offers a Free plan and a Pro plan:
          </Typography>
          <div className="pl-4">
            {BILLING_PLANS.map((plan) => (
              <div key={plan.title} className={plan.title === 'Pro' ? undefined : 'mb-6'}>
                <Typography variant="p" className="mb-1">
                  <strong>{plan.title}</strong> — {plan.price}
                </Typography>
                <Typography variant="list">
                  {plan.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </Typography>
              </div>
            ))}
          </div>
        </div>

        <div>
          <Typography variant="h3" className="mb-2">
            Cancel subscription
          </Typography>
          <Typography variant="p" className="mb-3">
            To cancel, use the Subscription settings in-app:
          </Typography>
          <div className="mb-6 pl-4">
            {CANCELLATION_STEPS.map((step, index) => (
              <Typography key={step} variant="p" className={index === CANCELLATION_STEPS.length - 1 ? undefined : 'mb-1'}>
                {index + 1}. {step}
              </Typography>
            ))}
          </div>
          <Typography variant="list">
            <li>Cancellation is <strong>end-of-period</strong>: your subscription remains active until the end of your current billing period</li>
            <li>After your billing period ends, your account transitions to the Free plan (feature limits apply)</li>
          </Typography>
        </div>
      </div>
    </DocPageLayout>
  )
}
