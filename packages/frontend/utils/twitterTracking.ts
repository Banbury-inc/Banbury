// Twitter (X) Event Tracking Utility
// This utility provides type-safe functions for tracking Twitter conversion events

// Extend the Window interface to include the Twitter tracking function
declare global {
  interface Window {
    twq: (action: string, eventId: string, params?: TwitterEventParams) => void;
  }
}

// TypeScript interfaces for Twitter event parameters
export interface TwitterEventContent {
  content_type?: string | null;
  content_id?: string | null;
  content_name?: string | null;
  content_price?: number | null;
  num_items?: number | null;
  content_group_id?: string | null;
}

export interface TwitterEventParams {
  value?: number | null;
  currency?: string | null;
  contents?: TwitterEventContent[] | null;
  conversion_id?: string | null;
  email_address?: string | null;
  phone_number?: string | null;
}

// Main event tracking function
export function trackTwitterEvent(eventId: string, params: TwitterEventParams = {}) {
  // Check if Twitter tracking is loaded
  if (typeof window !== 'undefined' && window.twq) {
    try {
      window.twq('event', eventId, params);
      console.log('Twitter event tracked:', eventId, params);
    } catch (error) {
      console.error('Error tracking Twitter event:', error);
    }
  } else {
    console.warn('Twitter tracking not loaded or not available');
  }
}

// Predefined event tracking functions for common use cases

/**
 * Track a purchase/conversion event
 * @param value - The value of the purchase
 * @param currency - Currency code (e.g., 'USD')
 * @param conversionId - Unique order/conversion ID
 * @param contents - Array of purchased items
 * @param email - User's email address
 * @param phone - User's phone number in E164 format
 */
export function trackPurchase({
  value,
  currency = 'USD',
  conversionId,
  contents,
  email,
  phone
}: {
  value?: number;
  currency?: string;
  conversionId?: string;
  contents?: TwitterEventContent[];
  email?: string;
  phone?: string;
}) {
  trackTwitterEvent('tw-qgsl6-qgsl7', {
    value,
    currency,
    conversion_id: conversionId,
    contents,
    email_address: email,
    phone_number: phone
  });
}

/**
 * Track a lead generation event
 * @param email - User's email address
 * @param phone - User's phone number
 * @param conversionId - Unique lead ID
 */
export function trackLead({
  email,
  phone,
  conversionId
}: {
  email?: string;
  phone?: string;
  conversionId?: string;
}) {
  trackTwitterEvent('tw-qgsl6-qgsl7', {
    email_address: email,
    phone_number: phone,
    conversion_id: conversionId
  });
}

/**
 * Track an add to cart event
 * @param contents - Array of items added to cart
 * @param value - Total value of items added
 * @param currency - Currency code
 */
export function trackAddToCart({
  contents,
  value,
  currency = 'USD'
}: {
  contents?: TwitterEventContent[];
  value?: number;
  currency?: string;
}) {
  trackTwitterEvent('tw-qgsl6-qgsl7', {
    contents,
    value,
    currency
  });
}

/**
 * Track a signup/registration event
 * @param email - User's email address
 * @param phone - User's phone number
 * @param conversionId - Unique signup ID
 */
export function trackSignup({
  email,
  phone,
  conversionId
}: {
  email?: string;
  phone?: string;
  conversionId?: string;
}) {
  trackTwitterEvent('tw-qgsl6-qgsl7', {
    email_address: email,
    phone_number: phone,
    conversion_id: conversionId
  });
}

/**
 * Track a custom event with specific parameters
 * @param eventData - Custom event parameters
 */
export function trackCustomEvent(eventData: TwitterEventParams) {
  trackTwitterEvent('tw-qgsl6-qgsl7', eventData);
}

/**
 * Helper function to create content objects for tracking
 * @param items - Array of items to convert to TwitterEventContent format
 */
export function createContentItems(items: Array<{
  type?: string;
  id?: string;
  name?: string;
  price?: number;
  quantity?: number;
  groupId?: string;
}>): TwitterEventContent[] {
  return items.map(item => ({
    content_type: item.type || null,
    content_id: item.id || null,
    content_name: item.name || null,
    content_price: item.price || null,
    num_items: item.quantity || null,
    content_group_id: item.groupId || null
  }));
}
