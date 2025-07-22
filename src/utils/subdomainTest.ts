import { subdomainService } from '@/config/subdomainConfig';

export const testSubdomainConfiguration = () => {
  const config = subdomainService.getConfig();
  
  console.group('🔍 Subdomain Configuration Test');
  console.log('Current hostname:', config.hostname);
  console.log('Is app subdomain:', config.isApp);
  console.log('Is marketing subdomain:', config.isMarketing);
  console.log('App URL:', config.appUrl);
  console.log('Marketing URL:', config.marketingUrl);
  console.log('Current path:', window.location.pathname);
  console.log('Should be on app:', subdomainService.shouldBeOnApp());
  console.log('Should be on marketing:', subdomainService.shouldBeOnMarketing());
  
  // Test URL generation
  console.group('🔗 URL Generation');
  console.log('App dashboard URL:', subdomainService.getAppUrl('/dashboard'));
  console.log('Marketing home URL:', subdomainService.getMarketingUrl('/'));
  console.log('Marketing pricing URL:', subdomainService.getMarketingUrl('/pricing'));
  console.groupEnd();
  
  console.groupEnd();
  
  return config;
}; 