import axios from 'axios';

export const trackPageView = async (path: string) => {
    try {
        // First get the IP address
        const ipResponse = await axios.get('https://api.ipify.org?format=json');
        const ip_address = ipResponse.data.ip;

        console.log(ip_address);

        // Then send both the path and IP to your endpoint
        await axios.post('http://www.api.dev.banbury.io/authentication/add_site_visitor_info/', {
            path,
            timestamp: new Date().toISOString(),
            ip_address
        });
    } catch (error) {
        console.error('Error tracking page view:', error);
    }
};

