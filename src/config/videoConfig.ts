// Video configuration for development vs production
const isDevelopment = import.meta.env.DEV;

// External hosting URLs - Note: Cloudinary URLs may be private, so we prioritize local files
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
  // Always try local files first - they work in both dev and production (if deployed)
  return `/videos/${filename}`;
};

// Helper function to get fallback video URL
export const getFallbackVideoUrl = (filename: string): string => {
  // For large video files, we'll need alternative hosting since Cloudinary is private
  // For now, try the external URL as a fallback, but expect it to fail
  if (filename === 'dashboard-final-video.mp4' || filename === 'web-dp-add-on.mp4') {
    // These large files might not be deployed to Vercel due to size limits
    // Return the external URL even though it may be private
    return EXTERNAL_VIDEO_URLS[filename as keyof typeof EXTERNAL_VIDEO_URLS] || `/videos/${filename}`;
  }
  
  // For smaller files, stick with local
  return `/videos/${filename}`;
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

// Export external URLs for reference
export const EXTERNAL_VIDEO_URLS_MAP = EXTERNAL_VIDEO_URLS; 