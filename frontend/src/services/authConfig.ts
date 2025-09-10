import { CONFIG } from '../config/config';

export const AUTH_CONFIG = {
  get redirectUri(): string {
    if (CONFIG.prod) {
      return 'https://www.banbury.io/auth/callback';
    }
    if (CONFIG.dev) {
      return 'https://www.dev.banbury.io/auth/callback';
    }
    return `${window.location.origin}/auth/callback`;
  },
};
