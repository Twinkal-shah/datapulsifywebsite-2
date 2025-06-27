import React from 'react';
import { LoadingProgress } from './LoadingProgress';
import { LoadingProgress as LoadingProgressType } from '@/hooks/useProgressiveLoading';

interface DataLoadingOverlayProps {
  progress: LoadingProgressType;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  isVisible: boolean;
}

export function DataLoadingOverlay({ 
  progress, 
  onCancel, 
  title = "Loading Dashboard Data",
  subtitle = "Please wait while we fetch your data...",
  isVisible 
}: DataLoadingOverlayProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 rounded-lg shadow-2xl border border-gray-700 p-6 max-w-md w-full">
        <div className="text-center mb-6">
          <h2 className="text-xl font-semibold text-white mb-2">{title}</h2>
          <p className="text-gray-400 text-sm">{subtitle}</p>
        </div>
        
        <LoadingProgress 
          progress={progress}
          onCancel={onCancel}
          showStages={true}
          className="border-0 bg-transparent p-0"
        />
        
        {progress.hasError && (
          <div className="mt-4 text-center">
            <p className="text-sm text-red-400 mb-2">
              Some data couldn't be loaded, but you can continue with partial results.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataLoadingOverlay; 