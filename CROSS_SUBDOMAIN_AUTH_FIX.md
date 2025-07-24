# Cross-Subdomain Authentication Fix

## Problem Statement

When users logged in with Google, they were correctly redirected to `app.datapulsify.com/dashboard`. However, when they navigated back to `datapulsify.com`, the login button was shown again instead of displaying the user's profile picture with a dropdown menu that includes a Dashboard option.

This issue occurred because authentication state was stored in localStorage, which is domain-specific and doesn't share between `datapulsify.com` and `app.datapulsify.com`.

## Root Cause Analysis

1. **Domain Isolation**: localStorage is scoped to specific domains/subdomains
2. **Supabase Configuration Issue**: Although Supabase was configured for cross-subdomain cookies, the custom storage implementation was overriding this with localStorage
3. **httpOnly Cookies**: The original cookie configuration used `httpOnly: true`, preventing JavaScript from reading cookies for cross-domain synchronization

## Solution Overview

The fix implements a hybrid approach that uses both cookies for cross-subdomain sharing and localStorage for fast client-side access:

### 1. Enhanced Supabase Client Configuration (`src/lib/supabaseClient.ts`)

```typescript
// Configure cookies for cross-subdomain access in production
...(isProduction && {
  cookieOptions: {
    name: 'supabase.auth.token',
    domain: '.datapulsify.com',
    path: '/',
    sameSite: 'lax',
    secure: true,
    httpOnly: false // Set to false so JavaScript can read for cross-domain sync
  }
}),
storage: {
  getItem: (key) => {
    // First try localStorage
    let item = localStorage.getItem(key);
    
    // If not found in localStorage and we're in production, try cookies
    if (!item && isProduction) {
      const cookieName = `supabase-auth-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const cookies = document.cookie.split(';');
      const cookie = cookies.find(c => c.trim().startsWith(`${cookieName}=`));
      if (cookie) {
        item = decodeURIComponent(cookie.split('=')[1]);
        // Sync back to localStorage for faster access
        if (item) {
          localStorage.setItem(key, item);
        }
      }
    }
    
    return item;
  },
  setItem: (key, value) => {
    // Always set in localStorage for current domain
    localStorage.setItem(key, value);
    sessionStorage.setItem(key, value);
    
    // In production, also set as cookie for cross-subdomain access
    if (isProduction) {
      const cookieName = `supabase-auth-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
      const expires = new Date();
      expires.setDate(expires.getDate() + 7); // 7 days
      
      document.cookie = `${cookieName}=${encodeURIComponent(value)}; domain=.datapulsify.com; path=/; expires=${expires.toUTCString()}; secure; samesite=lax`;
    }
  },
  removeItem: (key) => {
    // Remove from localStorage and sessionStorage
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
    
    // In production, also remove cookie
    if (isProduction) {
      const cookieName = `supabase-auth-${key.replace(/[^a-zA-Z0-9]/g, '-')}`;
      document.cookie = `${cookieName}=; domain=.datapulsify.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
    }
  }
}
```

### 2. Enhanced AuthContext (`src/contexts/AuthContext.tsx`)

#### A. Cross-Subdomain Session Detection

Added logic to detect and sync authentication data from cookies when localStorage doesn't contain auth data:

```typescript
// Cross-subdomain session check - look for auth data in cookies
const config = subdomainService.getConfig();
let hasCrossSubdomainAuth = false;

if (config.hostname.includes('datapulsify.com')) {
  console.log('🔍 Checking for cross-subdomain authentication...');
  
  // Check for Supabase auth cookies that might exist from other subdomain
  const cookies = document.cookie.split(';');
  const authCookies = cookies.filter(cookie => 
    cookie.trim().includes('supabase-auth-') || 
    cookie.trim().includes('sb-') ||
    cookie.trim().includes('supabase.auth.token')
  );
  
  if (authCookies.length > 0) {
    // Sync cookie data to localStorage and attempt session recovery
    // ...
  }
}
```

#### B. User Data Cookie Storage

Added a cross-subdomain user data cookie for immediate UI feedback:

```typescript
// In production, also store user data in cross-subdomain cookie for faster login detection
const config = subdomainService.getConfig();
if (config.hostname.includes('datapulsify.com')) {
  try {
    const userCookieValue = encodeURIComponent(JSON.stringify(enhancedUserData));
    const expires = new Date();
    expires.setDate(expires.getDate() + 7); // 7 days
    
    document.cookie = `datapulsify-user=${userCookieValue}; domain=.datapulsify.com; path=/; expires=${expires.toUTCString()}; secure; samesite=lax`;
    console.log('🍪 Stored user data in cross-subdomain cookie');
  } catch (error) {
    console.warn('⚠️ Failed to store user data in cookie:', error);
  }
}
```

#### C. Enhanced Cookie Cleanup

Updated the session clearing logic to also remove cross-subdomain cookies:

```typescript
// In production, also clear cross-subdomain auth cookies
const config = subdomainService.getConfig();
if (config.hostname.includes('datapulsify.com')) {
  console.log('🧹 Clearing cross-subdomain auth cookies...');
  
  // Clear any Supabase auth cookies and user data cookie
  const cookies = document.cookie.split(';');
  cookies.forEach(cookie => {
    const cookieName = cookie.trim().split('=')[0];
    if (cookieName.includes('supabase-auth-') || 
        cookieName.includes('sb-') || 
        cookieName === 'supabase.auth.token' ||
        cookieName === 'datapulsify-user') {
      document.cookie = `${cookieName}=; domain=.datapulsify.com; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; secure; samesite=lax`;
    }
  });
}
```

## How It Works

### User Flow After Fix

1. **User logs in on datapulsify.com**:
   - OAuth redirects to `app.datapulsify.com/auth/google/callback`
   - Session is established and stored in both localStorage and cross-subdomain cookies
   - User data is stored in both localStorage and `datapulsify-user` cookie
   - User is redirected to `app.datapulsify.com/dashboard`

2. **User navigates back to datapulsify.com**:
   - AuthContext checks localStorage first (empty on this domain)
   - Detects `datapulsify-user` cookie and immediately shows user profile
   - Checks for Supabase auth cookies and syncs them to localStorage
   - Attempts session recovery using synced cookie data
   - Profile picture and dropdown menu are displayed correctly

3. **User logs out**:
   - All localStorage/sessionStorage data is cleared
   - All cross-subdomain cookies are removed
   - User appears logged out on both domains

### Development vs Production

- **Development**: Uses localStorage only (single localhost domain)
- **Production**: Uses hybrid localStorage + cross-subdomain cookies approach

## Benefits

1. **Immediate UI Feedback**: User data cookie provides instant profile display
2. **Seamless Experience**: Users see consistent auth state across subdomains
3. **Performance**: localStorage used for fast access, cookies for synchronization
4. **Backward Compatible**: Existing auth flows continue to work
5. **Secure**: Cookies are secure, httpOnly disabled only for cross-domain sync

## Testing

To test the fix:

1. Log in on `https://datapulsify.com`
2. Verify redirect to `https://app.datapulsify.com/dashboard` 
3. Navigate back to `https://datapulsify.com`
4. Confirm profile picture and dropdown menu are displayed
5. Test logout from either domain clears auth state on both

## Files Modified

- `src/lib/supabaseClient.ts`: Enhanced storage configuration
- `src/contexts/AuthContext.tsx`: Cross-subdomain session synchronization
- `CROSS_SUBDOMAIN_AUTH_FIX.md`: This documentation

## Notes

- The fix only applies in production (`datapulsify.com` domains)
- Development continues to use localhost with standard localStorage
- All existing functionality remains unchanged
- Security is maintained through secure, SameSite cookies 