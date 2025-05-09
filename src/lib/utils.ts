import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const getRedirectUrl = () => {
  const isProd = import.meta.env.PROD;
  const prodUrl = 'https://datapulsify.com';
  const devUrl = 'http://localhost:3000';
  
  return isProd ? prodUrl : devUrl;
};
