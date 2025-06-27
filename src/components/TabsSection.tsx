import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { VIDEO_URLS } from '@/config/videoConfig';

const TabsSection = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

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
                <div className="rounded-xl shadow-2xl overflow-hidden ">
                  <video 
                    src={VIDEO_URLS.dashboardFinal}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error('Video failed to load:', e);
                      // Fallback to local path
                      e.currentTarget.src = '/videos/dashboard-final-video.mp4';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            )}

            {activeTab === 'sheet' && (
              <div className="animate-fade-in">
                <div className="rounded-xl shadow-2xl overflow-hidden ">
                  <video 
                    src={VIDEO_URLS.dpAddonWorking}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-auto"
                    onError={(e) => {
                      console.error('Video failed to load:', e);
                      // Fallback to local path
                      e.currentTarget.src = '/videos/dp-addon-working.mp4';
                    }}
                  >
                    Your browser does not support the video tag.
                  </video>
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