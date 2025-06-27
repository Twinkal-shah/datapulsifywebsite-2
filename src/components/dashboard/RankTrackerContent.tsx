import React, { useState } from 'react';
import { useProgressiveLoading } from '@/hooks/useProgressiveLoading';
import { DataLoadingOverlay } from '../DataLoadingOverlay';

// Import the existing content from RankTracker page
import RankTrackerPageContent from '@/pages/RankTracker';

interface RankTrackerContentProps {
  isActive: boolean;
  onNavigate?: (section: string) => void;
}

export function RankTrackerContent({ isActive, onNavigate }: RankTrackerContentProps) {
  const [isLoading, setIsLoading] = useState(false);
  
  // Progressive loading for Rank Tracker
  const progressiveLoading = useProgressiveLoading({
    stages: [
      { id: 'keywords', name: 'Loading Keyword Data', weight: 3 },
      { id: 'rankings', name: 'Loading Ranking History', weight: 2 },
      { id: 'countries', name: 'Loading Country Data', weight: 1 },
      { id: 'processing', name: 'Processing Rank Changes', weight: 1 }
    ],
    onComplete: () => {
      setIsLoading(false);
    },
    onError: () => {
      setIsLoading(false);
    }
  });

  return (
    <>
      {isLoading && (
        <DataLoadingOverlay
          progress={progressiveLoading.progress}
          onCancel={() => {
            progressiveLoading.cancelLoading();
            setIsLoading(false);
          }}
          isVisible={true}
          title="Loading Rank Tracker"
          subtitle="Fetching your keyword ranking data..."
        />
      )}
      
      {/* Render the existing component without the DashboardLayout */}
      <div className="w-full">
        <RankTrackerPageContent />
      </div>
    </>
  );
}

export default RankTrackerContent; 