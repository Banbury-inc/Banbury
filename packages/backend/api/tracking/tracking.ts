import { ApiService } from "../apiService";

interface TrackingData {
    path: string;
    ip_address: string;
    page_title?: string;
    referrer_source?: string;
    campaign_id?: string;
    content_type?: string;
    user_agent?: string;
}

export default class Tracking {
  constructor(api: ApiService) {}

  static async trackPageView(path: string, additionalData?: {
    pageTitle?: string;
    contentType?: string;
  }) {
    try {
        // Get the IP address from our backend (which avoids CORS issues)
        let ip_address = 'Unknown';
        
        try {
            const ipResponse = await ApiService.get<{ ip: string }>('/authentication/get_client_ip/');
            ip_address = ipResponse.ip;
        } catch (ipError) {
            // If IP lookup fails, continue with 'Unknown'
            console.debug('IP lookup failed, continuing without IP tracking');
        }

        // Extract referrer information from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const referrerSource = this.extractReferrerSource(urlParams);
        const campaignId = this.extractCampaignId(urlParams);
        
        // Prepare enhanced tracking data
        const trackingData: TrackingData = {
            path,
            ip_address,
            page_title: additionalData?.pageTitle || document.title || 'Unknown',
            referrer_source: referrerSource,
            campaign_id: campaignId,
            content_type: additionalData?.contentType || 'web_page',
            user_agent: navigator.userAgent || 'Unknown'
        };

        // Send enhanced tracking data to your endpoint using the API service
        await ApiService.trackPageViewEnhanced(trackingData);
    } catch (error) {
        // Silently fail for tracking - don't log errors to avoid console spam
        // This is a non-critical feature that shouldn't affect user experience
    }
  }

  private static extractReferrerSource(urlParams: URLSearchParams): string | undefined {
    // X/Twitter tracking parameters
    if (urlParams.has('twclid')) {
        return 'twitter';
    }
    
    // Facebook/Meta tracking parameters
    if (urlParams.has('fbclid')) {
        return 'facebook';
    }
    
    // Google tracking parameters
    if (urlParams.has('gclid')) {
        return 'google';
    }
    
    // LinkedIn tracking parameters
    if (urlParams.has('li_fat_id')) {
        return 'linkedin';
    }
    
    // UTM source parameter (standard)
    if (urlParams.has('utm_source')) {
        return urlParams.get('utm_source') || undefined;
    }
    
    // Check document.referrer as fallback
    if (document.referrer) {
        const referrerUrl = new URL(document.referrer);
        if (referrerUrl.hostname.includes('twitter.com') || referrerUrl.hostname.includes('t.co')) {
            return 'twitter';
        }
        if (referrerUrl.hostname.includes('facebook.com') || referrerUrl.hostname.includes('fb.com')) {
            return 'facebook';
        }
        if (referrerUrl.hostname.includes('google.com')) {
            return 'google';
        }
        if (referrerUrl.hostname.includes('linkedin.com')) {
            return 'linkedin';
        }
        return referrerUrl.hostname;
    }
    
    return undefined;
  }

  private static extractCampaignId(urlParams: URLSearchParams): string | undefined {
    // X/Twitter click ID
    if (urlParams.has('twclid')) {
        return urlParams.get('twclid') || undefined;
    }
    
    // Facebook click ID
    if (urlParams.has('fbclid')) {
        return urlParams.get('fbclid') || undefined;
    }
    
    // Google click ID
    if (urlParams.has('gclid')) {
        return urlParams.get('gclid') || undefined;
    }
    
    // UTM campaign parameter
    if (urlParams.has('utm_campaign')) {
        return urlParams.get('utm_campaign') || undefined;
    }
    
    return undefined;
  }
}

