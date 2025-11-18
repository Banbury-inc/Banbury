import Link from 'next/link';
import { Button } from '../components/ui/button';
import { useState, useEffect } from 'react';
import { ApiService } from '../../backend/api/apiService';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

// Initialize Stripe
const stripePromise = loadStripe('pk_live_51PGNdQJ2FLdDk2RmRpHZE9kX2yHJ9rIiVr5t8JfmV5eB1LyazU2uei7Qe0GdkpTnsMOz69w6hPNsU3KDmbUxyGOx00WxE03DQP');

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

      // Create payment intent on your backend
      const response = await ApiService.post('/billing/create-payment-intent/', {
        price_id: 'price_1S0mgfJ2ajHEyFo7q8TEcrO1'
      }) as any;

      if (!response.client_secret) {
        throw new Error('Failed to create payment intent');
      }

      // Confirm the payment with Stripe
      const { error: confirmError, paymentIntent } = await stripe.confirmPayment({
        elements,
        clientSecret: response.client_secret,
        confirmParams: {
          return_url: `${window.location.origin}/dashboard?success=true`,
        },
        redirect: 'if_required'
      });

      if (confirmError) {
        setError(confirmError.message || 'Payment failed');
      } else if (paymentIntent) {
        // Verify payment success with our backend
        await verifyPaymentSuccess(paymentIntent.id);
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

export default function Pricing(): JSX.Element {
  const [isLoading, setIsLoading] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);

  const handleProSubscription = async () => {
    setIsLoading(true);
    try {
      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        // Redirect to login if not authenticated
        window.location.href = '/login';
        return;
      }

      // Create payment intent
      const response = await ApiService.post('/billing/create-payment-intent/', {
        price_id: 'price_1S0mgfJ2ajHEyFo7q8TEcrO1'
      }) as any;

      if (response.client_secret) {
        setClientSecret(response.client_secret);
        setShowCheckout(true);
      } else {
        throw new Error('Failed to create payment intent');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      alert('Failed to start checkout process. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckoutSuccess = async () => {
    try {
      // Check payment status one more time to ensure everything is updated
      const paymentStatus = await checkPaymentStatus();
      console.log('Final payment status:', paymentStatus);
      
      setShowCheckout(false);
      setClientSecret(null);
      
      // Redirect to dashboard with success message
      window.location.href = '/dashboard?success=true&subscription=pro&payment_verified=true';
    } catch (error) {
      console.error('Error during success handling:', error);
      // Still redirect even if status check fails
      setShowCheckout(false);
      setClientSecret(null);
      window.location.href = '/dashboard?success=true&subscription=pro';
    }
  };

  const handleCheckoutCancel = () => {
    setShowCheckout(false);
    setClientSecret(null);
  };

  return (
    <div className="min-h-screen w-full" style={{ background: '#000000' }}>
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

      <section className="max-w-6xl mx-auto px-4 md:px-6 py-16 md:py-24">
        <div className="text-center mb-12 md:mb-16">
          <h1
            className="text-4xl md:text-5xl font-semibold tracking-tight mb-3"
            style={{ color: '#ffffff' }}
          >
            Simple, transparent pricing
          </h1>
          <p
            className="text-lg md:text-xl"
            style={{ color: '#a1a1aa' }}
          >
            Start for free. No credit card required.
          </p>
        </div>
        <section className="max-w-4xl mx-auto"> 
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div className="rounded-2xl p-6 md:p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="mb-6">
                <span
                  className="text-sm uppercase tracking-wider"
                  style={{ color: '#a1a1aa' }}
                >
                  Free
                </span>
                <h2
                  className="mt-2 text-3xl font-semibold"
                  style={{ color: '#ffffff' }}
                >
                  $0 <span className="text-base font-normal" style={{ color: '#a1a1aa' }}>/ month</span>
                </h2>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>Core features included</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>10 GB Storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>100 AI Requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>24/7 Support</span>
                </li>
              </ul>

              <Button asChild size="lg" className="w-full" style={{ minHeight: '44px' }}>
                <Link href="/register">Get started</Link>
              </Button>
            </div>
            
            <div className="rounded-2xl p-6 md:p-8"
              style={{
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)'
              }}
            >
              <div className="mb-6">
                <span
                  className="text-sm uppercase tracking-wider"
                  style={{ color: '#a1a1aa' }}
                >
                Pro 
                </span>
                <h2
                  className="mt-2 text-3xl font-semibold"
                  style={{ color: '#ffffff' }}
                >
                  $10 <span className="text-base font-normal" style={{ color: '#a1a1aa' }}>/ month</span>
                </h2>
              </div>

              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>Core features included</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>Unlimited Storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>Unlimited AI Requests</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-1 h-2 w-2 rounded-full" style={{ background: '#22c55e' }} />
                  <span style={{ color: '#e4e4e7' }}>24/7 Support</span>
                </li>
              </ul>

              <Button 
                size="lg" 
                className="w-full" 
                style={{ minHeight: '44px' }}
                onClick={handleProSubscription}
                disabled={isLoading}
              >
                {isLoading ? 'Processing...' : 'Get Pro'}
              </Button>
            </div>
          </div>
        </section>
      </section>
    </div>
  );
}
