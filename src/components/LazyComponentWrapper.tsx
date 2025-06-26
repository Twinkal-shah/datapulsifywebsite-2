import React, { Suspense, ComponentType, useState, useEffect } from 'react';
import { useTabVisibility } from '@/hooks/useTabVisibility';

interface LazyComponentWrapperProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  retryOnTabVisible?: boolean;
}

// Default loading fallback
const DefaultLoadingFallback = () => (
  <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
    <div className="text-white text-xl flex items-center gap-3">
      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
      Loading...
    </div>
  </div>
);

export function LazyComponentWrapper({ 
  children, 
  fallback = <DefaultLoadingFallback />,
  retryOnTabVisible = true 
}: LazyComponentWrapperProps) {
  const [key, setKey] = useState(0);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Reset component on tab visibility if needed - but only for errors
  const handleTabVisible = () => {
    if (retryOnTabVisible && hasError) {
      console.log('Tab became visible - retrying failed lazy component');
      setKey(prev => prev + 1);
      setHasError(false);
      setIsLoading(true);
    }
  };

  // Only use tab visibility for error recovery, not general loading
  useTabVisibility({
    onVisible: handleTabVisible
  });

  // Error boundary for lazy loading issues
  const ErrorBoundary = ({ children }: { children: React.ReactNode }) => {
    useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        if (error.error?.name === 'ChunkLoadError' || 
            error.message?.includes('Loading chunk')) {
          console.error('Chunk loading error detected:', error);
          setHasError(true);
        }
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-[#0f1115] to-gray-900 flex items-center justify-center">
          <div className="text-white text-center">
            <div className="text-xl mb-4">Loading Error</div>
            <div className="text-gray-300 mb-6">The page failed to load. This might be due to a network issue.</div>
            <button 
              onClick={() => {
                setKey(prev => prev + 1);
                setHasError(false);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }

    return <>{children}</>;
  };

  return (
    <ErrorBoundary key={key}>
      <Suspense 
        fallback={fallback}
        // Add onLoad callback to track loading completion
      >
        {children}
      </Suspense>
    </ErrorBoundary>
  );
}

// Higher-order component for wrapping lazy components
export function withLazyWrapper<P extends object>(
  LazyComponent: ComponentType<P>,
  options?: Omit<LazyComponentWrapperProps, 'children'>
) {
  return function WrappedComponent(props: P) {
    return (
      <LazyComponentWrapper {...options}>
        <LazyComponent {...props} />
      </LazyComponentWrapper>
    );
  };
} 