import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// export const getRedirectUrl = () => {
//   const isProd = import.meta.env.PROD;
//   // Make sure we're redirecting to the right domain in production
//   const prodUrl = 'https://datapulsify.com';
//   // Use the correct port for local development
//   const devUrl = window.location.port ? 
//     `${window.location.protocol}//${window.location.hostname}:${window.location.port}` : 
//     `${window.location.protocol}//${window.location.hostname}`;
  
//   console.log('Redirect URL:', isProd ? prodUrl : devUrl);
//   return isProd ? prodUrl : devUrl;
// };

export const getGoogleRedirectUrl = () => {
  // Always use the environment variable for Google OAuth redirect
  const googleRedirectUri = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
  if (googleRedirectUri) {
    // If we have a configured redirect URI, use it
    return new URL(googleRedirectUri).origin;
  }

  // Fallback to dynamic URL based on environment
  const isDev = import.meta.env.VITE_APP_ENV === 'development';
  return isDev ? 'http://localhost:8081' : 'https://datapulsify.com';
};

export const getSupabaseRedirectUrl = () => {
  // For Supabase auth, we want to use the current origin
  const isDev = import.meta.env.VITE_APP_ENV === 'development';
  return isDev ? 'http://localhost:8081' : 'https://datapulsify.com';
};

export function formatGSCPropertyUrl(gscProperty: string): string {
  if (!gscProperty) return '';
  
  // Remove any trailing slashes
  const cleanProperty = gscProperty.replace(/\/+$/, '');
  
  // If it already starts with http:// or https://, return as is
  if (/^https?:\/\//i.test(cleanProperty)) {
    return cleanProperty;
  }
  
  // Add https:// prefix
  return `https://${cleanProperty}`;
}
