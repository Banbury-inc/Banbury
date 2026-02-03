import Link from 'next/link'
import { useState, useEffect } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { Check, Zap, Shield, Clock, HardDrive, Sparkles, Headphones } from 'lucide-react'

import { Button } from '../components/common/ui/button'
import { Badge } from '../components/common/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '../components/common/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '../components/common/ui/dialog'

import {
  STRIPE_PUBLIC_KEY,
  PRO_PRICE_ID,
  getUserInfo,
  startProCheckout,
  handlePaymentSuccess,
  verifyPaymentSuccess,
  createPaymentIntent,
  getReturnUrl,
} from './handlers/pricing'

// ─────────────────────────────────────────────────────────────────────────────
// Stripe initialization
// ─────────────────────────────────────────────────────────────────────────────

const stripePromise = loadStripe(STRIPE_PUBLIC_KEY)

// ─────────────────────────────────────────────────────────────────────────────
// Static content
// ─────────────────────────────────────────────────────────────────────────────

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  price: number
  period: string
  description: string
  features: PlanFeature[]
  cta: string
  popular?: boolean
}

const PLANS: Plan[] = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'month',
    description: 'Perfect for getting started and exploring the platform.',
    features: [
      { text: 'Core features included', included: true },
      { text: '10 GB Storage', included: true },
      { text: '100 AI Requests / month', included: true },
      { text: 'Community support', included: true },
      { text: 'Basic integrations', included: true },
    ],
    cta: 'Get started',
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 10,
    period: 'month',
    description: 'For professionals who need unlimited power.',
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Unlimited Storage', included: true },
      { text: 'Unlimited AI Requests', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced integrations', included: true },
      { text: 'API access', included: true },
    ],
    cta: 'Get Pro',
    popular: true,
  },
]

interface FeatureHighlight {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
}

const FEATURE_HIGHLIGHTS: FeatureHighlight[] = [
  {
    icon: Sparkles,
    title: 'AI-Powered',
    description: 'Leverage cutting-edge AI to automate tasks and boost productivity.',
  },
  {
    icon: HardDrive,
    title: 'Secure Storage',
    description: 'Your data is encrypted and safely stored in the cloud.',
  },
  {
    icon: Zap,
    title: 'Lightning Fast',
    description: 'Optimized performance for instant responses and real-time sync.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade encryption and compliance with industry standards.',
  },
  {
    icon: Clock,
    title: 'Always Available',
    description: '99.9% uptime guarantee with redundant infrastructure.',
  },
  {
    icon: Headphones,
    title: 'Dedicated Support',
    description: 'Get help when you need it from our expert support team.',
  },
]

interface ComparisonRow {
  feature: string
  free: string | boolean
  pro: string | boolean
}

const COMPARISON_TABLE: ComparisonRow[] = [
  { feature: 'Storage', free: '10 GB', pro: 'Unlimited' },
  { feature: 'AI Requests', free: '100 / month', pro: 'Unlimited' },
  { feature: 'File uploads', free: true, pro: true },
  { feature: 'Collaboration', free: true, pro: true },
  { feature: 'API access', free: false, pro: true },
  { feature: 'Priority support', free: false, pro: true },
  { feature: 'Advanced integrations', free: false, pro: true },
  { feature: 'Custom workflows', free: false, pro: true },
]

interface FAQ {
  question: string
  answer: string
}

const FAQS: FAQ[] = [
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your Pro subscription at any time. Your access will continue until the end of your billing period.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards, debit cards, Apple Pay, and Google Pay through our secure payment processor, Stripe.',
  },
  {
    question: 'Is there a free trial for Pro?',
    answer: 'We offer a generous free tier that lets you explore all core features. You can upgrade to Pro anytime when you need more capacity.',
  },
  {
    question: 'What happens to my data if I downgrade?',
    answer: 'Your data remains safe. If you exceed free tier limits, you\'ll have read-only access until you reduce usage or upgrade again.',
  },
  {
    question: 'Do you offer discounts for annual billing?',
    answer: 'We currently offer monthly billing only. Annual plans with discounts are coming soon.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Checkout Form Component (client-only, uses Stripe hooks)
// ─────────────────────────────────────────────────────────────────────────────

interface CheckoutFormProps {
  onSuccess: () => void
  onCancel: () => void
}

function CheckoutForm({ onSuccess, onCancel }: CheckoutFormProps) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPaymentElementReady, setIsPaymentElementReady] = useState(false)
  const [userInfo, setUserInfo] = useState(getUserInfo())

  useEffect(() => {
    const info = getUserInfo()
    setUserInfo(info)

    const handleStorageChange = () => setUserInfo(getUserInfo())
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!stripe || !elements) return

    setIsLoading(true)
    setError(null)

    try {
      const { error: submitError } = await elements.submit()
      if (submitError) {
        setError(submitError.message || 'Payment failed')
        setIsLoading(false)
        return
      }

      const response = await createPaymentIntent(PRO_PRICE_ID)

      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: response.client_secret,
        confirmParams: { return_url: getReturnUrl() },
        redirect: 'if_required',
      })

      if (confirmError) {
        setError(confirmError.message || 'Payment failed')
      } else if (paymentIntent) {
        await verifyPaymentSuccess(paymentIntent.id)
        onSuccess()
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment failed'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-lg bg-muted/50 p-4">
        <PaymentElement
          options={{
            layout: {
              type: 'accordion',
              defaultCollapsed: false,
              radios: true,
              spacedAccordionItems: true,
            },
            defaultValues: {
              billingDetails: {
                name: userInfo?.name || '',
                email: userInfo?.email || '',
              },
            },
            fields: {
              billingDetails: {
                name: userInfo?.name ? 'auto' : 'never',
                email: userInfo?.email ? 'auto' : 'never',
                phone: 'auto',
                address: 'auto',
              },
            },
            wallets: { applePay: 'auto', googlePay: 'auto' },
          }}
          onReady={() => setIsPaymentElementReady(true)}
        />
      </div>

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button
          type="submit"
          disabled={!stripe || !isPaymentElementReady || isLoading}
          className="flex-1"
          size="lg"
        >
          {isLoading ? 'Processing...' : 'Subscribe to Pro — $10/month'}
        </Button>
        <Button type="button" onClick={onCancel} variant="outline" size="lg">
          Cancel
        </Button>
      </div>
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Pricing Card Component
// ─────────────────────────────────────────────────────────────────────────────

interface PricingCardProps {
  plan: Plan
  onSelectPro: () => void
  isLoading: boolean
}

function PricingCard({ plan, onSelectPro, isLoading }: PricingCardProps) {
  const isPro = plan.id === 'pro'

  return (
    <Card
      className={`relative flex flex-col ${
        plan.popular
          ? 'border-primary/50 bg-card shadow-lg shadow-primary/5'
          : 'bg-card/50'
      }`}
    >
      {plan.popular && (
        <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">
          Most Popular
        </Badge>
      )}

      <CardHeader className="pb-2">
        <p className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
          {plan.name}
        </p>
        <div className="mt-2 flex items-baseline gap-1">
          <span className="text-4xl font-bold text-foreground">${plan.price}</span>
          <span className="text-muted-foreground">/ {plan.period}</span>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{plan.description}</p>
      </CardHeader>

      <CardContent className="flex-1">
        <ul className="space-y-3">
          {plan.features.map((feature) => (
            <li key={feature.text} className="flex items-start gap-3">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm text-foreground">{feature.text}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isPro ? (
          <Button
            size="lg"
            className="w-full"
            onClick={onSelectPro}
            disabled={isLoading}
          >
            {isLoading ? 'Processing...' : plan.cta}
          </Button>
        ) : (
          <Button asChild size="lg" variant="outline" className="w-full">
            <Link href="/register">{plan.cta}</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Feature Grid Component
// ─────────────────────────────────────────────────────────────────────────────

function FeatureGrid() {
  return (
    <section className="mx-auto max-w-5xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Everything you need to succeed
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Powerful features designed to help you work smarter, not harder.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURE_HIGHLIGHTS.map((feature) => {
          const Icon = feature.icon
          return (
            <div
              key={feature.title}
              className="group rounded-xl border border-border/50 bg-card/30 p-6 transition-colors hover:border-border hover:bg-card/50"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="mb-2 font-semibold text-foreground">{feature.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {feature.description}
              </p>
            </div>
          )
        })}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Comparison Table Component
// ─────────────────────────────────────────────────────────────────────────────

function ComparisonTable() {
  return (
    <section className="mx-auto max-w-4xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Compare plans
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          See what&apos;s included in each plan.
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="px-6 py-4 font-semibold text-foreground">Feature</th>
              <th className="px-6 py-4 text-center font-semibold text-foreground">Free</th>
              <th className="px-6 py-4 text-center font-semibold text-foreground">Pro</th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_TABLE.map((row, idx) => (
              <tr
                key={row.feature}
                className={idx < COMPARISON_TABLE.length - 1 ? 'border-b border-border/50' : ''}
              >
                <td className="px-6 py-4 text-foreground">{row.feature}</td>
                <td className="px-6 py-4 text-center">
                  {typeof row.free === 'boolean' ? (
                    row.free ? (
                      <Check className="mx-auto h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    <span className="text-muted-foreground">{row.free}</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {typeof row.pro === 'boolean' ? (
                    row.pro ? (
                      <Check className="mx-auto h-4 w-4 text-primary" />
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )
                  ) : (
                    <span className="font-medium text-foreground">{row.pro}</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// FAQ Section Component
// ─────────────────────────────────────────────────────────────────────────────

function FAQSection() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 md:px-6 md:py-24">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Frequently asked questions
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          Have questions? We&apos;ve got answers.
        </p>
      </div>

      <div className="space-y-4">
        {FAQS.map((faq) => (
          <details
            key={faq.question}
            className="group rounded-lg border border-border bg-card/30 transition-colors hover:bg-card/50 [&[open]]:bg-card/50"
          >
            <summary className="flex cursor-pointer items-center justify-between px-6 py-4 font-medium text-foreground marker:content-none">
              {faq.question}
              <span className="ml-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="px-6 pb-4 text-sm leading-relaxed text-muted-foreground">
              {faq.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Final CTA Section Component
// ─────────────────────────────────────────────────────────────────────────────

interface FinalCTAProps {
  onGetPro: () => void
  isLoading: boolean
}

function FinalCTA({ onGetPro, isLoading }: FinalCTAProps) {
  return (
    <section className="border-t border-border/50 bg-muted/20">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center md:px-6 md:py-24">
        <h2 className="text-3xl font-semibold tracking-tight text-foreground">
          Ready to get started?
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-muted-foreground">
          Join thousands of users who are already boosting their productivity. Start free or go Pro today.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button asChild size="lg" variant="outline">
            <Link href="/register">Start for free</Link>
          </Button>
          <Button size="lg" onClick={onGetPro} disabled={isLoading}>
            {isLoading ? 'Processing...' : 'Get Pro — $10/month'}
          </Button>
        </div>
      </div>
    </section>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Pricing Page Component
// ─────────────────────────────────────────────────────────────────────────────

export default function Pricing(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [clientSecret, setClientSecret] = useState<string | null>(null)

  const handleProSubscription = async () => {
    setIsLoading(true)
    const result = await startProCheckout()
    setIsLoading(false)

    if (result.success && result.clientSecret) {
      setClientSecret(result.clientSecret)
      setIsCheckoutOpen(true)
    } else if (result.error) {
      alert(result.error)
    }
  }

  const handleCheckoutSuccess = async () => {
    setIsCheckoutOpen(false)
    setClientSecret(null)
    await handlePaymentSuccess()
  }

  const handleCheckoutCancel = () => {
    setIsCheckoutOpen(false)
    setClientSecret(null)
  }

  return (
    <div className="min-h-screen w-full bg-background">
      {/* Checkout Dialog */}
      <Dialog open={isCheckoutOpen} onOpenChange={setIsCheckoutOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Subscribe to Pro</DialogTitle>
            <DialogDescription>
              Unlock unlimited storage and AI requests for $10/month.
            </DialogDescription>
          </DialogHeader>

          {clientSecret && (
            <Elements
              stripe={stripePromise}
              options={{
                clientSecret,
                appearance: { theme: 'night' },
              }}
            >
              <CheckoutForm
                onSuccess={handleCheckoutSuccess}
                onCancel={handleCheckoutCancel}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      {/* Hero Section */}
      <section className="mx-auto max-w-6xl px-4 py-16 md:px-6 md:py-24">
        <div className="mb-16 text-center">
          <Badge variant="secondary" className="mb-4">
            Simple pricing
          </Badge>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl lg:text-6xl">
            Plans that scale with you
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground md:text-xl">
            Start for free. Upgrade when you&apos;re ready. No credit card required.
          </p>
        </div>

        {/* Pricing Cards */}
        <div className="mx-auto grid max-w-4xl gap-8 md:grid-cols-2">
          {PLANS.map((plan) => (
            <PricingCard
              key={plan.id}
              plan={plan}
              onSelectPro={handleProSubscription}
              isLoading={isLoading}
            />
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <FeatureGrid />

      {/* Comparison Table */}
      <ComparisonTable />

      {/* FAQ Section */}
      <FAQSection />

      {/* Final CTA */}
      <FinalCTA onGetPro={handleProSubscription} isLoading={isLoading} />
    </div>
  )
}
