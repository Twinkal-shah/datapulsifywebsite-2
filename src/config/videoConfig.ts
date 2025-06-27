// Video configuration for development vs production
const isDevelopment = import.meta.env.DEV;

// External hosting URLs - Updated with Cloudinary URLs
const EXTERNAL_VIDEO_URLS = {
  'dashboard-final-video.mp4': 'https://res.cloudinary.com/dqqv3zxzp/video/upload/v1751002560/dashboard-final-video_qh5jwx.mov',
  'dp-addon-working.mp4': 'https://res.cloudinary.com/dqqv3zxzp/video/upload/v1751003944/web-dp-add-on_rmolpq.mp4',
  'dashboard-hero-section.gif': '/videos/dashboard-hero-section.gif', // Keep local for smaller files
  'quick-win-screenshot.gif': '/videos/quick-win-screenshot.gif',
  'track-weekly-keyword-rankings.gif': '/videos/track-weekly-keyword-rankings.gif',
  'google-sheets-integration.gif': '/videos/google-sheets-integration.gif',
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