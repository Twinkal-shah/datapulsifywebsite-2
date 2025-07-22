# Subdomain Structure Implementation

This document outlines the implementation of the subdomain structure for Datapulsify, separating the marketing website from the authenticated user application.

## Architecture Overview

### Subdomain Structure
- **Marketing Website**: `https://datapulsify.com`
  - Homepage, features, pricing, support, and all public-facing content
  - User authentication initiates here
  - Redirects authenticated users to app subdomain

- **Application Dashboard**: `https://app.datapulsify.com`
  - All authenticated user functionality
  - Dashboard, account settings, reports, and tools
  - Protected routes that require authentication
  - Redirects unauthenticated users back to marketing site

## Implementation Details

### 1. Subdomain Configuration (`src/config/subdomainConfig.ts`)

**Purpose**: Central configuration for detecting and managing subdomain context

**Key Features**:
- Automatic subdomain detection based on hostname
- Development environment support with localhost
- URL generation helpers for cross-subdomain navigation
- Route validation to ensure users are on correct subdomain

**Usage**:
```typescript
import { subdomainService } from '@/config/subdomainConfig';

// Get current configuration
const config = subdomainService.getConfig();

// Generate URLs
const dashboardUrl = subdomainService.getAppUrl('/dashboard');
const homeUrl = subdomainService.getMarketingUrl('/');

// Redirect users
subdomainService.redirectToApp('/dashboard');
subdomainService.redirectToMarketing('/');
```

### 2. Routing Architecture

#### Marketing Routes (`src/components/routing/MarketingRoutes.tsx`)
Handles all public-facing pages:
- Homepage (`/`)
- Features, pricing, support pages
- Authentication callback
- Shared reports (accessible from both subdomains)

#### App Routes (`src/components/routing/AppRoutes.tsx`)
Handles all authenticated application pages:
- Dashboard (`/dashboard`)
- Account management (`/account`)
- Settings (`/settings`)
- Analytics tools (`/click-gap-intelligence`, `/rank-tracker`, etc.)
- Protected route wrapper that redirects unauthenticated users

#### Main App Router (`src/App.tsx`)
**SubdomainRouter Component**: 
- Detects current subdomain context
- Renders appropriate route component (Marketing or App)
- Handles automatic redirects in production environment

### 3. Authentication Flow Updates (`src/contexts/AuthContext.tsx`)

**Login Flow**:
1. User initiates login on marketing site (`datapulsify.com`)
2. OAuth redirect configured to go to app subdomain (`app.datapulsify.com/dashboard`)
3. AuthContext detects successful login and handles subdomain-aware redirect

**Logout Flow**:
1. User logs out from app subdomain
2. System redirects back to marketing site
3. All auth tokens and user data cleared

**Key Changes**:
```typescript
// Login redirect
const redirectUrl = subdomainService.getAppUrl('/dashboard');

// Logout redirect
if (config.isApp && config.hostname.includes('datapulsify.com')) {
  subdomainService.redirectToMarketing('/');
}
```

### 4. Navigation Updates (`src/components/Navbar.tsx`)

**Subdomain-Aware Navigation**:
- Login redirects to app subdomain
- Dashboard links check current subdomain and redirect appropriately
- Preserves existing functionality for localhost development

**Example Implementation**:
```typescript
// Dashboard navigation
const config = subdomainService.getConfig();
if (config.isMarketing && config.hostname.includes('datapulsify.com')) {
  window.location.href = subdomainService.getAppUrl('/dashboard');
} else {
  navigate('/dashboard');
}
```

### 5. Deployment Configuration (`vercel.json`)

**Production Routing Rules**:
- Server-side redirects for app routes accessed on marketing domain
- Security headers for both subdomains
- Automatic redirection from `datapulsify.com/dashboard` to `app.datapulsify.com/dashboard`

**Key Redirects**:
```json
{
  "source": "/dashboard",
  "has": [{"type": "host", "value": "datapulsify.com"}],
  "destination": "https://app.datapulsify.com/dashboard",
  "permanent": false
}
```

## Development Environment

### Local Development Support
The implementation gracefully handles localhost development:
- Single app serves both marketing and app functionality
- Subdomain logic detects path-based routing for dashboard pages
- No special configuration required for development

### Testing Tools
**Dev Panel Integration** (`src/components/DevNavPanel.tsx`):
- Added "Test Subdomain Config" button
- Logs current subdomain configuration to console
- Validates URL generation and routing logic

**Test Utility** (`src/utils/subdomainTest.ts`):
```typescript
import { testSubdomainConfiguration } from '@/utils/subdomainTest';
testSubdomainConfiguration(); // Logs detailed config info
```

## Benefits Achieved

### 1. **Improved Security**
- Clear separation between public and authenticated areas
- Isolated cookie domains
- Better CORS and authentication handling

### 2. **Performance Optimization**
- Marketing site optimized for SEO and public access
- App subdomain optimized for authenticated user experience
- Independent deployment and caching strategies possible

### 3. **Scalability**
- Infrastructure can be independently scaled
- Clear separation of concerns
- Future microservices architecture support

### 4. **User Experience**
- Clean URL structure (`app.datapulsify.com/dashboard`)
- Intuitive separation between marketing and app
- Seamless authentication flow

## Deployment Checklist

### Pre-Deployment Steps
1. **DNS Configuration**:
   - Set up `app.datapulsify.com` subdomain
   - Configure SSL certificates for both domains
   - Update domain verification settings

2. **Environment Variables**:
   - Verify OAuth redirect URLs include app subdomain
   - Update any hardcoded domain references
   - Test authentication flow in staging

3. **Database Updates**:
   - Ensure user sessions work across subdomains
   - Verify OAuth callback URLs are updated
   - Test shared report functionality

### Post-Deployment Verification
1. **Marketing Site** (`datapulsify.com`):
   - ✅ Homepage loads correctly
   - ✅ Login initiates properly
   - ✅ Dashboard links redirect to app subdomain

2. **App Subdomain** (`app.datapulsify.com`):
   - ✅ Dashboard loads for authenticated users
   - ✅ Unauthenticated users redirect to marketing
   - ✅ All app routes function correctly

3. **Cross-Subdomain Flow**:
   - ✅ Login from marketing → dashboard on app
   - ✅ Logout from app → homepage on marketing
   - ✅ Shared reports accessible from both subdomains

## Troubleshooting

### Common Issues
1. **Authentication Loops**: Verify OAuth redirect URLs match subdomain structure
2. **CORS Issues**: Ensure proper domain configuration in Supabase settings
3. **Development Testing**: Use browser dev tools to test different hostname scenarios

### Debug Tools
- Use `testSubdomainConfiguration()` function in dev panel
- Check browser console for subdomain detection logs
- Verify `subdomainService.getConfig()` returns expected values

## Future Enhancements

### Potential Improvements
1. **CDN Optimization**: Different caching strategies for marketing vs. app
2. **Subdomain-Specific Analytics**: Separate tracking for marketing and app usage
3. **API Subdomain**: Consider `api.datapulsify.com` for backend services
4. **Multi-Region Support**: Geographic subdomain routing

This implementation provides a solid foundation for the subdomain architecture while maintaining development environment compatibility and providing comprehensive testing tools. 