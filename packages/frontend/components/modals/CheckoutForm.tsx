import { useEffect, useState } from 'react'
import { PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'

import { Button } from '../common/ui/button'
import { Typography } from '../common/ui/typography'
import {
  getCheckoutUserInfo,
  handleCheckoutSubmit,
  handleStorageChange,
} from './handlers/checkoutFormHandlers'

interface CheckoutFormProps {
  onSuccess: () => void
  onCancel: () => void
}

export function CheckoutForm({ onSuccess, onCancel }: Readonly<CheckoutFormProps>) {
  const stripe = useStripe()
  const elements = useElements()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [paymentElementReady, setPaymentElementReady] = useState(false)
  const [userInfo, setUserInfo] = useState(getCheckoutUserInfo())

  useEffect(() => {
    setUserInfo(getCheckoutUserInfo())

    const onStorageChange = () => handleStorageChange({ setUserInfo })

    window.addEventListener('storage', onStorageChange)
    return () => window.removeEventListener('storage', onStorageChange)
  }, [])

  return (
    <form
      onSubmit={(event) => handleCheckoutSubmit({
        event,
        stripe,
        elements,
        paymentElementReady,
        userInfo,
        onSuccess,
        setError,
        setIsLoading,
      })}
      className="space-y-4"
    >
      <PaymentElement
        onReady={() => setPaymentElementReady(true)}
        options={{
          layout: 'tabs',
        }}
      />

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3">
          <Typography variant="small" className="text-destructive">
            {error}
          </Typography>
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
