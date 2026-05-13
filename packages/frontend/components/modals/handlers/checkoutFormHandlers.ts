import type { Dispatch, FormEvent, SetStateAction } from 'react'
import type { Stripe, StripeElements } from '@stripe/stripe-js'

import { ApiService } from '../../../../backend/api/apiService'

interface CheckoutUserInfo {
  email: string
  name: string
}

interface PaymentVerificationResponse {
  payment_succeeded: boolean
}

interface HandleCheckoutSubmitParams {
  event: FormEvent
  stripe: Stripe | null
  elements: StripeElements | null
  paymentElementReady: boolean
  userInfo: CheckoutUserInfo | null
  onSuccess: () => void
  setError: Dispatch<SetStateAction<string | null>>
  setIsLoading: Dispatch<SetStateAction<boolean>>
}

interface HandleStorageChangeParams {
  setUserInfo: Dispatch<SetStateAction<CheckoutUserInfo | null>>
}

export function getCheckoutUserInfo() {
  if (typeof window === 'undefined') return null

  const userEmail = localStorage.getItem('userEmail')
  const username = localStorage.getItem('username')

  return {
    email: userEmail || '',
    name: username || '',
  }
}

export function handleStorageChange({ setUserInfo }: HandleStorageChangeParams) {
  setUserInfo(getCheckoutUserInfo())
}

export async function handleCheckoutSubmit({
  event,
  stripe,
  elements,
  paymentElementReady,
  userInfo,
  onSuccess,
  setError,
  setIsLoading,
}: HandleCheckoutSubmitParams) {
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
      return
    }

    if (paymentIntent?.status !== 'succeeded') return

    try {
      await verifyPaymentSuccess(paymentIntent.id)
      onSuccess()
    } catch (verifyError) {
      console.error('Error verifying payment:', verifyError)
      onSuccess()
    }
  } catch (error) {
    setError(error instanceof Error ? error.message : 'An unexpected error occurred')
    setIsLoading(false)
  }
}

async function verifyPaymentSuccess(paymentIntentId: string) {
  try {
    const response = await ApiService.post('/billing/verify-payment-intent/', {
      payment_intent_id: paymentIntentId,
    }) as PaymentVerificationResponse

    if (response.payment_succeeded) return response

    throw new Error('Payment not successful')
  } catch (error) {
    console.error('Error verifying payment:', error)
    throw error
  }
}
