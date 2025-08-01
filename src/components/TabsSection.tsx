import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { VIDEO_URLS } from '@/config/videoConfig';

const TabsSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [videoErrors, setVideoErrors] = useState<Record<string, number>>({});
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});

  // Debug: Log video URLs on component mount
  useEffect(() => {
    console.log('🎥 TabsSection: Video URLs configured:', {
      dashboardFinal: VIDEO_URLS.dashboardFinal,
      dpAddonWorking: VIDEO_URLS.dpAddonWorking
    });
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
        // First fallback: ensure we're using local file
        const localUrl = '/videos/dashboard-final-video.mp4';
        console.log(`🎥 Trying fallback URL for dashboard: ${localUrl}`);
        video.src = localUrl;
      }
    } else if (videoKey === 'sheet') {
      if (currentErrors === 0) {
        // First fallback: ensure we're using local file
        const localUrl = '/videos/web-dp-add-on.mp4';
        console.log(`🎥 Trying fallback URL for sheet: ${localUrl}`);
        video.src = localUrl;
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
      // Try local file first on retry
      if (videoKey === 'dashboard') {
        videoElement.src = '/videos/dashboard-final-video.mp4';
      } else if (videoKey === 'sheet') {
        videoElement.src = '/videos/web-dp-add-on.mp4';
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
        <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-400 border border-gray-700 rounded-lg">
          <div className="text-center space-y-4">
            <p className="text-lg font-medium">Video temporarily unavailable</p>
            <p className="text-sm text-gray-500">{altText}</p>
            <p className="text-xs text-gray-600">Attempted to load: {src}</p>
            <button
              onClick={() => handleRetryVideo(videoKey)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
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