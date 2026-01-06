import { ApiService } from '../../../backend/api/apiService'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface UserInfo {
  email: string
  name: string
}

export interface PaymentIntentResponse {
  client_secret: string
}

export interface PaymentStatusResponse {
  payment_succeeded?: boolean
  subscription_status?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

export const STRIPE_PUBLIC_KEY = 'pk_live_51PGNdQJ2FLdDk2RmRpHZE9kX2yHJ9rIiVr5t8JfmV5eB1LyazU2uei7Qe0GdkpTnsMOz69w6hPNsU3KDmbUxyGOx00WxE03DQP'
export const PRO_PRICE_ID = 'price_1S0mgfJ2ajHEyFo7q8TEcrO1'

// ─────────────────────────────────────────────────────────────────────────────
// LocalStorage helpers
// ─────────────────────────────────────────────────────────────────────────────

export function getUserInfo(): UserInfo | null {
  if (typeof window === 'undefined') return null

  const userEmail = localStorage.getItem('userEmail')
  const username = localStorage.getItem('username')

  return {
    email: userEmail || '',
    name: username || '',
  }
}

export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem('authToken')
}

export function isAuthenticated(): boolean {
  return !!getAuthToken()
}

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

export async function createPaymentIntent(priceId: string): Promise<PaymentIntentResponse> {
  const response = await ApiService.post('/billing/create-payment-intent/', {
    price_id: priceId,
  }) as PaymentIntentResponse

  if (!response.client_secret) {
    throw new Error('Failed to create payment intent')
  }

  return response
}

export async function verifyPaymentSuccess(paymentIntentId: string): Promise<PaymentStatusResponse> {
  const response = await ApiService.post('/billing/verify-payment-intent/', {
    payment_intent_id: paymentIntentId,
  }) as PaymentStatusResponse

  if (!response.payment_succeeded) {
    throw new Error('Payment not successful')
  }

  return response
}

export async function checkPaymentStatus(): Promise<PaymentStatusResponse> {
  return ApiService.get('/billing/check-payment-status/') as Promise<PaymentStatusResponse>
}

// ─────────────────────────────────────────────────────────────────────────────
// Navigation helpers
// ─────────────────────────────────────────────────────────────────────────────

export function redirectToLogin(): void {
  window.location.href = '/login'
}

export function redirectToDashboardSuccess(paymentVerified = false): void {
  const params = new URLSearchParams({
    success: 'true',
    subscription: 'pro',
  })
  if (paymentVerified) params.set('payment_verified', 'true')
  window.location.href = `/dashboard?${params.toString()}`
}

export function getReturnUrl(): string {
  if (typeof window === 'undefined') return '/dashboard?success=true'
  return `${window.location.origin}/dashboard?success=true`
}

// ─────────────────────────────────────────────────────────────────────────────
// Checkout flow handlers
// ─────────────────────────────────────────────────────────────────────────────

export interface StartCheckoutResult {
  success: boolean
  clientSecret?: string
  error?: string
}

export async function startProCheckout(): Promise<StartCheckoutResult> {
  if (!isAuthenticated()) {
    redirectToLogin()
    return { success: false, error: 'Not authenticated' }
  }

  try {
    const response = await createPaymentIntent(PRO_PRICE_ID)
    return { success: true, clientSecret: response.client_secret }
  } catch (error) {
    console.error('Error creating payment intent:', error)
    return { success: false, error: 'Failed to start checkout process. Please try again.' }
  }
}

export async function handlePaymentSuccess(): Promise<void> {
  try {
    await checkPaymentStatus()
    redirectToDashboardSuccess(true)
  } catch (error) {
    console.error('Error during success handling:', error)
    // Still redirect even if status check fails
    redirectToDashboardSuccess(false)
  }
}
