import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { VIDEO_URLS } from '@/config/videoConfig';

const TabsSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [videoErrors, setVideoErrors] = useState<Record<string, boolean>>({});
  const [videoLoading, setVideoLoading] = useState<Record<string, boolean>>({});

  const handleVideoError = (videoKey: string, event: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    // Prevent infinite error loops
    if (videoErrors[videoKey]) {
      console.warn(`Video ${videoKey} failed to load even with fallback`);
      return;
    }

    console.warn(`Video ${videoKey} failed to load, trying fallback...`);
    setVideoErrors(prev => ({ ...prev, [videoKey]: true }));
    setVideoLoading(prev => ({ ...prev, [videoKey]: false }));

    const video = event.currentTarget;
    
    // Set fallback URLs based on video type
    if (videoKey === 'dashboard') {
      video.src = '/videos/dashboard-final-video.mp4'; // Try local file as fallback
    } else if (videoKey === 'sheet') {
      video.src = '/videos/web-dp-add-on.mp4'; // Try local file as fallback
    }
  };

  const handleVideoLoadStart = (videoKey: string) => {
    setVideoLoading(prev => ({ ...prev, [videoKey]: true }));
  };

  const handleVideoCanPlay = (videoKey: string) => {
    setVideoLoading(prev => ({ ...prev, [videoKey]: false }));
  };

  const renderVideo = (videoKey: string, src: string, altText: string) => {
    if (videoErrors[videoKey]) {
      return (
        <div className="w-full h-64 bg-gray-800 flex items-center justify-center text-gray-400">
          <div className="text-center">
            <p className="mb-2">Video temporarily unavailable</p>
            <p className="text-sm">{altText}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="relative">
        {videoLoading[videoKey] && (
          <div className="absolute inset-0 bg-gray-800 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
        <video 
          src={src}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-auto"
          onLoadStart={() => handleVideoLoadStart(videoKey)}
          onCanPlay={() => handleVideoCanPlay(videoKey)}
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