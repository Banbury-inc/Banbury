import axios from 'axios';
import { ApiService } from './apiService';

export const trackPageView = async (path: string) => {
    try {
        // First get the IP address
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const ip_address = ipResponse.data.ip;

        // Then send both the path and IP to your endpoint using the API service
        await ApiService.trackPageView(path, ip_address);
    } catch (error) {
        // Silently fail for tracking - don't log errors to avoid console spam
        // This is a non-critical feature that shouldn't affect user experience
    }
};

