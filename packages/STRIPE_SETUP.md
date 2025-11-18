# Stripe Embeddable UI Components Setup

This guide will help you set up Stripe's embeddable UI components for a custom checkout flow.

## 1. Install Dependencies

First, install the required Stripe packages in your frontend:

```bash
cd Banbury-Website/frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

## 2. Environment Variables

Make sure your backend has the correct Stripe secret key in the `.env` file:

```bash
STRIPE_SECRET_KEY=sk_test_51S0SPMJ2ajHEyFo7ys7kRk1m3tCVeq0DHULn3SW3ysl09GRGPmy7V5Ev6iXIhYvRVxZ7RUy9LAK5jFSLia9y05yC00Jy3GuHWL
```

## 3. Features Implemented

### Frontend (Pricing.tsx):
- ✅ **Custom Checkout Modal**: Embedded Stripe checkout form
- ✅ **PaymentElement**: Stripe's pre-built payment form
- ✅ **Error Handling**: Real-time error display
- ✅ **Loading States**: Processing indicators
- ✅ **Success/Cancel Flow**: Proper redirect handling

### Backend (billing/views.py):
- ✅ **Payment Intent Creation**: Creates Stripe payment intents
- ✅ **Authentication**: Bearer token validation
- ✅ **User Metadata**: Links payments to user accounts
- ✅ **Error Handling**: Comprehensive error responses

## 4. User Flow

1. **User clicks "Get Pro"** → Authentication check
2. **Backend creates payment intent** → Returns client secret
3. **Modal opens** → Shows embedded Stripe payment form
4. **User enters payment details** → Real-time validation
5. **Payment processing** → Loading states and error handling
6. **Success** → Redirects to dashboard with success message
7. **Cancel** → Closes modal and returns to pricing page

## 5. Customization Options

### Styling:
- The modal uses your existing dark theme
- PaymentElement automatically adapts to your styling
- Custom CSS classes for consistent branding

### Payment Methods:
- Automatically enabled: Cards, Apple Pay, Google Pay
- Configurable in Stripe Dashboard
- Real-time validation and error messages

### Error Handling:
- Network errors
- Payment method errors
- Authentication errors
- Server errors

## 6. Security Features

- ✅ **Client-side**: Uses Stripe's secure PaymentElement
- ✅ **Server-side**: Payment intent creation on backend
- ✅ **Authentication**: Bearer token validation
- ✅ **Metadata**: User tracking for subscription management

## 7. Testing

Use Stripe test cards:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Requires Authentication**: `4000 0025 0000 3155`

## 8. Production Deployment

1. Switch to live Stripe keys
2. Update webhook endpoints
3. Test with real payment methods
4. Monitor payment success rates

## 9. Benefits of Custom Flow

- **Branded Experience**: Maintains your app's look and feel
- **Better UX**: No redirect to external page
- **More Control**: Custom error handling and validation
- **Analytics**: Track user behavior through checkout
- **Mobile Optimized**: Responsive design for all devices
