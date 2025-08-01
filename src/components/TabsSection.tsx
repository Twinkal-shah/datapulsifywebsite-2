import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { VIDEO_URLS, getFallbackVideoUrl } from '@/config/videoConfig';

const TabsSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [videoErrors, setVideoErrors] = useState<Record<string, number>>({});
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});

  // Debug: Log video URLs on component mount and test accessibility
  useEffect(() => {
    console.log('🎥 TabsSection: Video URLs configured:', {
      dashboardFinal: VIDEO_URLS.dashboardFinal,
      dpAddonWorking: VIDEO_URLS.dpAddonWorking,
      isDev: import.meta.env.DEV
    });

    // Test video accessibility on mount
    const testVideoAccessibility = async () => {
      const testUrls = [
        { key: 'dashboard', url: VIDEO_URLS.dashboardFinal },
        { key: 'sheet', url: VIDEO_URLS.dpAddonWorking }
      ];

      for (const { key, url } of testUrls) {
        try {
          console.log(`🎥 Testing accessibility of ${key} video: ${url}`);
          const response = await fetch(url, { method: 'HEAD' });
          if (!response.ok) {
            console.warn(`🎥 Video ${key} not accessible (${response.status}), will show fallback content`);
            setVideoErrors(prev => ({ ...prev, [key]: 2 })); // Set to max errors to show fallback
          } else {
            console.log(`🎥 Video ${key} is accessible`);
          }
        } catch (error) {
          console.warn(`🎥 Video ${key} failed accessibility test:`, error);
          setVideoErrors(prev => ({ ...prev, [key]: 2 })); // Set to max errors to show fallback
        }
      }
    };

    // Only test in production (where we expect issues)
    if (!import.meta.env.DEV) {
      testVideoAccessibility();
    }
  }, []);

  const handleVideoError = (videoKey: string, event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    const currentErrors = videoErrors[videoKey] || 0;
    const video = event.currentTarget as HTMLVideoElement;
    
    console.error(`🎥 Video ${videoKey} failed to load:`, {
      attempt: currentErrors + 1,
      src: video.src,
      error: event.nativeEvent
    });
    
    // Allow up to 2 attempts (original + 1 fallback)
    if (currentErrors >= 2) {
      console.warn(`🎥 Video ${videoKey} failed to load after ${currentErrors} attempts, giving up`);
      return;
    }

    console.warn(`🎥 Video ${videoKey} failed to load (attempt ${currentErrors + 1}), trying fallback...`);
    setVideoErrors(prev => ({ ...prev, [videoKey]: currentErrors + 1 }));
    setVideoLoading(prev => ({ ...prev, [videoKey]: false }));

    // Set fallback URLs based on video type and attempt number
    if (videoKey === 'dashboard') {
      if (currentErrors === 0) {
        // First fallback: use the fallback URL function
        const fallbackUrl = getFallbackVideoUrl('dashboard-final-video.mp4');
        console.log(`🎥 Trying fallback URL for dashboard: ${fallbackUrl}`);
        video.src = fallbackUrl;
      }
    } else if (videoKey === 'sheet') {
      if (currentErrors === 0) {
        // First fallback: use the fallback URL function
        const fallbackUrl = getFallbackVideoUrl('web-dp-add-on.mp4');
        console.log(`🎥 Trying fallback URL for sheet: ${fallbackUrl}`);
        video.src = fallbackUrl;
      }
    }
  };

  const handleVideoLoadStart = (videoKey: string) => {
    console.log(`🎥 Video ${videoKey} started loading`);
    setVideoLoading(prev => ({ ...prev, [videoKey]: true }));
  };

  const handleVideoCanPlay = (videoKey: string) => {
    console.log(`🎥 Video ${videoKey} can play`);
    setVideoLoading(prev => ({ ...prev, [videoKey]: false }));
    // Reset error count on successful load
    setVideoErrors(prev => ({ ...prev, [videoKey]: 0 }));
  };

  const handleVideoLoadedData = (videoKey: string) => {
    console.log(`🎥 Video ${videoKey} loaded data successfully`);
  };

  const handleRetryVideo = (videoKey: string) => {
    console.log(`🎥 Retrying video ${videoKey}...`);
    setVideoErrors(prev => ({ ...prev, [videoKey]: 0 }));
    setVideoLoading(prev => ({ ...prev, [videoKey]: true }));
    
    // Force re-render by updating the key
    const videoElement = document.querySelector(`[data-video-key="${videoKey}"]`) as HTMLVideoElement;
    if (videoElement) {
      // Try fallback URL on retry
      if (videoKey === 'dashboard') {
        videoElement.src = getFallbackVideoUrl('dashboard-final-video.mp4');
      } else if (videoKey === 'sheet') {
        videoElement.src = getFallbackVideoUrl('web-dp-add-on.mp4');
      }
      videoElement.load();
    }
  };

  const renderVideo = (videoKey: string, src: string, altText: string) => {
    const errorCount = videoErrors[videoKey] || 0;
    const hasErrors = errorCount >= 2;
    
    console.log(`🎥 Rendering video ${videoKey}:`, {
      src,
      errorCount,
      hasErrors,
      isLoading: videoLoading[videoKey]
    });
    
    if (hasErrors) {
      return (
        <div className="w-full bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700 rounded-lg min-h-[400px]">
          <div className="text-center space-y-6 max-w-md px-6">
            {/* Icon */}
            <div className="mx-auto w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            
            {/* Content */}
            <div className="space-y-3">
              <h3 className="text-xl font-semibold text-white">
                {videoKey === 'dashboard' ? 'Dashboard Preview' : 'Google Sheets Integration'}
              </h3>
              <p className="text-gray-400 leading-relaxed">
                {videoKey === 'dashboard' 
                  ? 'Experience a comprehensive SEO dashboard with real-time keyword tracking, performance metrics, and actionable insights to boost your search rankings.'
                  : 'Seamlessly integrate with Google Sheets to export your SEO data, create automated reports, and collaborate with your team using familiar spreadsheet tools.'
                }
              </p>
            </div>
            
            {/* Features list */}
            <div className="text-left space-y-2">
              <p className="text-sm font-medium text-gray-300 mb-3">Key Features:</p>
              {videoKey === 'dashboard' ? (
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Real-time keyword ranking tracking</li>
                  <li>• Performance analytics and insights</li>
                  <li>• Click gap analysis</li>
                  <li>• Custom AI-powered reports</li>
                </ul>
              ) : (
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• One-click data export to Google Sheets</li>
                  <li>• Automated report generation</li>
                  <li>• Team collaboration features</li>
                  <li>• Custom data formatting</li>
                </ul>
              )}
            </div>
            
            <div className="pt-4 space-y-3">
              <button
                onClick={() => handleRetryVideo(videoKey)}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                Try Loading Video Again
              </button>
              {!import.meta.env.DEV && (
                <p className="text-xs text-gray-500">
                  Video demos are being optimized for faster loading
                </p>
              )}
              <p className="text-xs text-gray-500">
                Video content is optimized for desktop viewing
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {videoLoading[videoKey] && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10 rounded-lg">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
              <p className="text-white text-sm">Loading video...</p>
              <p className="text-white text-xs mt-1">{src}</p>
            </div>
          </div>
        )}
        <video 
          data-video-key={videoKey}
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto rounded-lg"
          onLoadStart={() => handleVideoLoadStart(videoKey)}
          onCanPlay={() => handleVideoCanPlay(videoKey)}
          onLoadedData={() => handleVideoLoadedData(videoKey)}
          onError={(e) => handleVideoError(videoKey, e)}
        >
          Your browser does not support the video tag.
        </video>
      </div>
    );
  };

  return (
    <section className="bg-black py-12 md:py-16">
      <div className="px-4 md:px-8 w-full max-w-[95vw] mx-auto">
        <div className="flex flex-col items-center">
          {/* Tabs */}
          <div className="flex space-x-2 p-1 bg-gray-900/50 rounded-lg backdrop-blur-sm border border-gray-800 mb-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={cn(
                'px-6 py-2.5 rounded-md transition-all duration-300 font-medium',
                activeTab === 'dashboard'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('sheet')}
              className={cn(
                'px-6 py-2.5 rounded-md transition-all duration-300 font-medium',
                activeTab === 'sheet'
                  ? 'bg-white text-black'
                  : 'text-gray-400 hover:text-white'
              )}
            >
              Google Sheet
            </button>
          </div>

          {/* Content */}
          <div className="w-full">
            {activeTab === 'dashboard' && (
              <div className="animate-fade-in">
                <div className="rounded-xl shadow-2xl overflow-hidden">
                  {renderVideo('dashboard', VIDEO_URLS.dashboardFinal, 'Dashboard preview coming soon')}
                </div>
              </div>
            )}

            {activeTab === 'sheet' && (
              <div className="animate-fade-in">
                <div className="rounded-xl shadow-2xl overflow-hidden">
                  {renderVideo('sheet', VIDEO_URLS.dpAddonWorking, 'Google Sheets integration preview coming soon')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default TabsSection; 