// Video configuration for development vs production
const isDevelopment = import.meta.env.DEV;

// External hosting URLs - Cloudinary URLs as backup
const EXTERNAL_VIDEO_URLS = {
  'dashboard-final-video.mp4': 'https://res.cloudinary.com/dqqv3zxzp/video/upload/v1751002560/dashboard-final-video_qh5jwx.mov',
  'web-dp-add-on.mp4': 'https://res.cloudinary.com/dqqv3zxzp/video/upload/v1751003944/web-dp-add-on_rmolpq.mp4',
  'dashboard-hero-section.gif': '/videos/dashboard-hero-section.gif',
  'quick-win-screenshot.gif': '/videos/quick-win-screenshot.gif',
  'track-weekly-keyword-rankings.gif': '/videos/track-weekly-keyword-rankings.gif',
  'google-sheets-integration.gif': '/videos/google-sheets-integration.gif',
};

// Helper function to get video URL
export const getVideoUrl = (filename: string): string => {
  // Always try local files first, regardless of environment
  // This ensures better reliability since we know the local files exist
  return `/videos/${filename}`;
};

// Helper function to get external video URL (for fallback)
export const getExternalVideoUrl = (filename: string): string => {
  return EXTERNAL_VIDEO_URLS[filename as keyof typeof EXTERNAL_VIDEO_URLS] || `/videos/${filename}`;
};

// Export specific video URLs for easy access
export const VIDEO_URLS = {
  dashboardFinal: getVideoUrl('dashboard-final-video.mp4'),
  dpAddonWorking: getVideoUrl('web-dp-add-on.mp4'),
  dashboardHero: getVideoUrl('dashboard-hero-section.gif'),
  quickWin: getVideoUrl('quick-win-screenshot.gif'),
  weeklyRankings: getVideoUrl('track-weekly-keyword-rankings.gif'),
  googleSheetsIntegration: getVideoUrl('google-sheets-integration.gif'),
};

// Export external URLs for fallback purposes
export const EXTERNAL_VIDEO_URLS_MAP = EXTERNAL_VIDEO_URLS; 