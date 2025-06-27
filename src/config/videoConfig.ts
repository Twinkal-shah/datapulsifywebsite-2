// Video configuration for development vs production
const isDevelopment = import.meta.env.DEV;

// External hosting URLs (replace with your actual URLs)
const EXTERNAL_VIDEO_URLS = {
  'dashboard-final-video.mp4': 'https://your-cdn.com/videos/dashboard-final-video.mp4',
  'dp-addon-working.mp4': 'https://your-cdn.com/videos/dp-addon-working.mp4',
  'dashboard-hero-section.gif': 'https://your-cdn.com/videos/dashboard-hero-section.gif',
  'quick-win-screenshot.gif': 'https://your-cdn.com/videos/quick-win-screenshot.gif',
  'track-weekly-keyword-rankings.gif': 'https://your-cdn.com/videos/track-weekly-keyword-rankings.gif',
  'google-sheets-integration.gif': 'https://your-cdn.com/videos/google-sheets-integration.gif',
};

// Helper function to get video URL
export const getVideoUrl = (filename: string): string => {
  // In development, use local files
  if (isDevelopment) {
    return `/videos/${filename}`;
  }
  
  // In production, use external URLs if available, otherwise fall back to local
  return EXTERNAL_VIDEO_URLS[filename as keyof typeof EXTERNAL_VIDEO_URLS] || `/videos/${filename}`;
};

// Export specific video URLs for easy access
export const VIDEO_URLS = {
  dashboardFinal: getVideoUrl('dashboard-final-video.mp4'),
  dpAddonWorking: getVideoUrl('dp-addon-working.mp4'),
  dashboardHero: getVideoUrl('dashboard-hero-section.gif'),
  quickWin: getVideoUrl('quick-win-screenshot.gif'),
  weeklyRankings: getVideoUrl('track-weekly-keyword-rankings.gif'),
  googleSheetsIntegration: getVideoUrl('google-sheets-integration.gif'),
}; 