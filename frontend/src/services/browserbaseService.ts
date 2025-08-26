export interface BrowserbaseSessionResult {
  id: string;
  viewerUrl?: string;
  embedUrl?: string;
  connectionUrl?: string;
  debugUrl?: string;
}

import { CONFIG } from '../config/config';
import { ApiService } from './apiService';

export class BrowserbaseService {
  static async createSession(startUrl?: string): Promise<{ success: boolean; session?: BrowserbaseSessionResult; error?: string }> {
    try {
      console.log('[BrowserbaseService] Creating session with startUrl:', startUrl);
      
      // Prefer backend endpoint (authentication namespace) so allowlist applies
      let respData: any;
      let lastError: any;
      
      try {
        console.log('[BrowserbaseService] Trying authentication endpoint...');
        respData = await ApiService.post<any>('/authentication/browserbase/session/', { startUrl });
      } catch (e: any) {
        console.log('[BrowserbaseService] Authentication endpoint failed:', e?.response?.data || e?.message);
        lastError = e;
        
        // Fallback to legacy path if configured
        try {
          console.log('[BrowserbaseService] Trying fallback endpoint...');
          respData = await ApiService.post<any>('/browserbase/session/', { startUrl });
        } catch (fallbackError: any) {
          console.log('[BrowserbaseService] Fallback endpoint also failed:', fallbackError?.response?.data || fallbackError?.message);
          throw lastError; // Use the original error
        }
      }
      
      console.log('[BrowserbaseService] Response received:', respData);
      
      if (!respData || typeof respData !== 'object') {
        return { success: false, error: 'Invalid response from server' };
      }
      
      // Check for explicit server error responses
      if (respData.success === false) {
        const errorMsg = respData.error || respData.message || 'Session creation failed';
        console.error('[BrowserbaseService] Server reported failure:', errorMsg);
        return { success: false, error: errorMsg };
      }
      
      // Normalize possible keys
      const session: BrowserbaseSessionResult = {
        id: respData.id || respData.sessionId || 'unknown',
        viewerUrl: respData.viewerUrl || respData.embedUrl,
        embedUrl: respData.embedUrl,
        connectionUrl: respData.connectUrl || respData.connection_url,
        debugUrl: respData.debugUrl || respData.debug_url,
      };
      
      console.log('[BrowserbaseService] Parsed session:', session);
      
      // Validate session has required fields
      if (!session.id || session.id === 'unknown') {
        return { success: false, error: 'No valid session ID received from server' };
      }
      
      if (!session.viewerUrl && !session.embedUrl) {
        // If backend is not available or didn't return embed, fallback to webview
        console.log('[BrowserbaseService] No viewer URL received, using fallback');
        const fallbackUrl = startUrl || 'https://news.google.com';
        return { success: true, session: { id: 'webview-fallback', viewerUrl: fallbackUrl } };
      }
      
      console.log('[BrowserbaseService] Session created successfully:', session.id);
      
      // If a custom startUrl was provided and it's not the default, navigate to it
      if (startUrl && startUrl !== 'https://www.google.com') {
        console.log(`[BrowserbaseService] Navigating to custom start URL: ${startUrl}`);
        const navResult = await this.navigateSession(session.id, startUrl);
        if (!navResult.success) {
          console.warn(`[BrowserbaseService] Failed to navigate to ${startUrl}:`, navResult.error);
        }
      }
      
      return { success: true, session };
      
    } catch (e: any) {
      console.error('[BrowserbaseService] Session creation error:', e);
      
      // Only fallback to direct webview if route is missing (404). Do NOT fallback on 401.
      if (e?.response?.status === 404) {
        console.log('[BrowserbaseService] 404 error, using webview fallback');
        const fallbackUrl = startUrl || 'https://news.google.com';
        return { success: true, session: { id: 'webview-fallback', viewerUrl: fallbackUrl } };
      }
      
      const msg = (e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Unexpected error');
      console.error('[BrowserbaseService] Final error:', msg);
      return { success: false, error: msg };
    }
  }

  static async navigateSession(sessionId: string, url: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Navigating session ${sessionId} to ${url}`);
      
      const respData = await ApiService.post<any>('/browserbase/navigate/', {
        sessionId,
        url
      });
      
      if (respData.success === false) {
        return { success: false, error: respData.error || 'Navigation failed' };
      }
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Navigation failed');
      console.error('[BrowserbaseService] Navigation error:', msg);
      return { success: false, error: msg };
    }
  }

  static async clickElement(sessionId: string, selector: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Clicking element ${selector} in session ${sessionId}`);
      
      const respData = await ApiService.post<any>('/browserbase/click/', {
        sessionId,
        selector
      });
      
      if (respData.success === false) {
        return { success: false, error: respData.error || 'Click failed' };
      }
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Click failed');
      console.error('[BrowserbaseService] Click error:', msg);
      return { success: false, error: msg };
    }
  }

  static async takeScreenshot(sessionId: string, fullPage: boolean = false): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Taking screenshot of session ${sessionId}`);
      
      const respData = await ApiService.post<any>('/browserbase/screenshot/', {
        sessionId,
        fullPage
      });
      
      if (respData.success === false) {
        return { success: false, error: respData.error || 'Screenshot failed' };
      }
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Screenshot failed');
      console.error('[BrowserbaseService] Screenshot error:', msg);
      return { success: false, error: msg };
    }
  }

  static async typeText(sessionId: string, selector: string, text: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Typing text into ${selector} in session ${sessionId}`);
      
      const respData = await ApiService.post<any>('/browserbase/type_text/', {
        sessionId,
        selector,
        text
      });
      
      if (respData.success === false) {
        return { success: false, error: respData.error || 'Type failed' };
      }
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Type failed');
      console.error('[BrowserbaseService] Type error:', msg);
      return { success: false, error: msg };
    }
  }

  static async getPageContent(sessionId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Getting page content for session ${sessionId}`);
      
      const respData = await ApiService.post<any>('/browserbase/get_content/', {
        sessionId
      });
      
      if (respData.success === false) {
        return { success: false, error: respData.error || 'Get content failed' };
      }
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Get content failed');
      console.error('[BrowserbaseService] Get content error:', msg);
      return { success: false, error: msg };
    }
  }

  static async waitFor(sessionId: string, selector?: string, timeout: number = 5000): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Waiting in session ${sessionId}`);
      
      const respData = await ApiService.post<any>('/browserbase/wait_for/', {
        sessionId,
        selector,
        timeout
      });
      
      if (respData.success === false) {
        return { success: false, error: respData.error || 'Wait failed' };
      }
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Wait failed');
      console.error('[BrowserbaseService] Wait error:', msg);
      return { success: false, error: msg };
    }
  }

  static async checkSession(sessionId: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`[BrowserbaseService] Checking session ${sessionId}`);
      
      const respData = await ApiService.post<any>('/browserbase/check_session/', {
        sessionId
      });
      
      return { success: true, data: respData };
    } catch (e: any) {
      const msg = (e?.response?.data?.error || e?.message || 'Session check failed');
      console.error('[BrowserbaseService] Session check error:', msg);
      return { success: false, error: msg };
    }
  }
}


