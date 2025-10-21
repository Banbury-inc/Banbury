# Twitter (X) Event Tracking Usage Guide

This guide shows how to use the Twitter event tracking utilities in your application.

## Setup

The base Twitter pixel is already installed in `_document.tsx` and will load on all pages. The event tracking utilities are available in `src/utils/twitterTracking.ts`.

## Basic Usage

### Import the tracking functions

```typescript
import { 
  trackPurchase, 
  trackLead, 
  trackAddToCart, 
  trackSignup, 
  trackCustomEvent,
  createContentItems 
} from '@/utils/twitterTracking';
```

## Common Event Tracking Examples

### 1. Track a Purchase/Conversion

```typescript
// Basic purchase tracking
trackPurchase({
  value: 99.99,
  currency: 'USD',
  conversionId: 'order_12345',
  email: 'user@example.com'
});

// Purchase with product details
const purchaseItems = createContentItems([
  {
    type: 'product',
    id: 'prod_001',
    name: 'Premium Subscription',
    price: 99.99,
    quantity: 1,
    groupId: 'subscriptions'
  }
]);

trackPurchase({
  value: 99.99,
  currency: 'USD',
  conversionId: 'order_12345',
  contents: purchaseItems,
  email: 'user@example.com',
  phone: '+1234567890'
});
```

### 2. Track Lead Generation

```typescript
// Track when someone submits a contact form
trackLead({
  email: 'lead@example.com',
  phone: '+1234567890',
  conversionId: 'lead_12345'
});
```

### 3. Track Add to Cart

```typescript
const cartItems = createContentItems([
  {
    type: 'product',
    id: 'prod_002',
    name: 'Business Plan',
    price: 49.99,
    quantity: 1
  }
]);

trackAddToCart({
  contents: cartItems,
  value: 49.99,
  currency: 'USD'
});
```

### 4. Track User Signup/Registration

```typescript
// Track successful user registration
trackSignup({
  email: 'newuser@example.com',
  conversionId: 'signup_12345'
});
```

### 5. Track Custom Events

```typescript
// Track any custom event with specific parameters
trackCustomEvent({
  value: 25.00,
  currency: 'USD',
  conversion_id: 'demo_request_123',
  email_address: 'prospect@example.com'
});
```

## Integration Examples

### In a React Component (Purchase Success Page)

```typescript
import React, { useEffect } from 'react';
import { trackPurchase, createContentItems } from '@/utils/twitterTracking';

interface PurchaseSuccessProps {
  orderData: {
    id: string;
    total: number;
    currency: string;
    customerEmail: string;
    items: Array<{
      id: string;
      name: string;
      price: number;
      quantity: number;
    }>;
  };
}

export function PurchaseSuccess({ orderData }: PurchaseSuccessProps) {
  useEffect(() => {
    // Track the purchase when the component mounts
    const contentItems = createContentItems(
      orderData.items.map(item => ({
        type: 'product',
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity
      }))
    );

    trackPurchase({
      value: orderData.total,
      currency: orderData.currency,
      conversionId: orderData.id,
      contents: contentItems,
      email: orderData.customerEmail
    });
  }, [orderData]);

  return (
    <div>
      <h1>Thank you for your purchase!</h1>
      {/* Your success page content */}
    </div>
  );
}
```

### In a Form Handler

```typescript
import { trackLead } from '@/utils/twitterTracking';

async function handleContactFormSubmit(formData: {
  email: string;
  phone?: string;
  name: string;
  message: string;
}) {
  try {
    // Submit the form to your backend
    const response = await submitContactForm(formData);
    
    // Track the lead conversion
    trackLead({
      email: formData.email,
      phone: formData.phone,
      conversionId: response.leadId
    });
    
    // Show success message
  } catch (error) {
    // Handle error
  }
}
```

### In an E-commerce Cart

```typescript
import { trackAddToCart, createContentItems } from '@/utils/twitterTracking';

function addToCart(product: Product) {
  // Add to cart logic
  addProductToCart(product);
  
  // Track the add to cart event
  const contentItems = createContentItems([{
    type: 'product',
    id: product.id,
    name: product.name,
    price: product.price,
    quantity: 1,
    groupId: product.category
  }]);
  
  trackAddToCart({
    contents: contentItems,
    value: product.price,
    currency: 'USD'
  });
}
```

## Best Practices

1. **Always include conversion_id**: Use unique identifiers for deduplication
2. **Email format**: Ensure emails are properly formatted
3. **Phone format**: Use E164 format for phone numbers (e.g., +1234567890)
4. **Currency codes**: Use ISO 4217 currency codes (USD, EUR, GBP, etc.)
5. **Error handling**: The utility includes built-in error handling, but always test your implementations
6. **Privacy compliance**: Ensure you have proper consent before tracking personal information like email and phone

## Testing

To test if events are firing correctly:

1. Install the **X Pixel Helper** browser extension
2. Navigate to pages where you've implemented tracking
3. Perform the actions that should trigger events
4. Check the extension to see if events are being fired
5. Verify in your X Ads Manager that events are being received

## Event Parameters Reference

| Parameter | Type | Description |
|-----------|------|-------------|
| value | number | Monetary value of the conversion |
| currency | string | ISO 4217 currency code |
| contents | array | Array of content/product objects |
| conversion_id | string | Unique identifier for deduplication |
| email_address | string | User's email address |
| phone_number | string | User's phone in E164 format |

## Content Object Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| content_type | string | Type of content (e.g., 'product', 'service') |
| content_id | string | Unique identifier for the content |
| content_name | string | Name/title of the content |
| content_price | number | Price of the individual item |
| num_items | number | Quantity of this item |
| content_group_id | string | Category or group identifier |
