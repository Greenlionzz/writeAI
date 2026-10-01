import { Capacitor } from '@capacitor/core';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim().replace(/\/+$/, '') ?? '';

export function apiUrl(path: string): string {
  if (Capacitor.isNativePlatform() && !apiBaseUrl) {
    throw new Error(
      'API server URL is not configured. Set VITE_API_BASE_URL to your deployed server URL and rebuild the app.'
    );
  }

  return `${apiBaseUrl}${path.startsWith('/') ? path : `/${path}`}`;
}