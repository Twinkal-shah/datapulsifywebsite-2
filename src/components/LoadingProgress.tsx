import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X, AlertCircle, CheckCircle2, Clock, Loader2 } from 'lucide-react';
import { LoadingProgress as LoadingProgressType, LoadingStage } from '@/hooks/useProgressiveLoading';

interface LoadingProgressProps {
  progress: LoadingProgressType;
  onCancel?: () => void;
  className?: string;
  compact?: boolean;
  showStages?: boolean;
}

const getStatusIcon = (status: LoadingStage['status']) => {
  switch (status) {
    case 'pending':
      return <Clock className="h-4 w-4 text-gray-400" />;
    case 'loading':
      return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />;
    case 'completed':
      return <CheckCircle2 className="h-4 w-4 text-green-400" />;
    case 'error':
      return <AlertCircle className="h-4 w-4 text-red-400" />;
    default:
      return <Clock className="h-4 w-4 text-gray-400" />;
  }
};

const getStatusColor = (status: LoadingStage['status']) => {
  switch (status) {
    case 'pending':
      return 'text-gray-400';
    case 'loading':
      return 'text-blue-400';
    case 'completed':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    default:
      return 'text-gray-400';
  }
};

const getProgressColor = (progress: number, hasError: boolean) => {
  if (hasError) return 'bg-red-500';
  if (progress === 100) return 'bg-green-500';
  return 'bg-blue-500';
};

export function LoadingProgress({ 
  progress, 
  onCancel, 
  className = '', 
  compact = false,
  showStages = true 
}: LoadingProgressProps) {
  const { overall, currentStage, stages, isLoading, hasError, canCancel } = progress;

  if (compact) {
    return (
      <div className={`flex items-center gap-3 p-4 bg-gray-800 rounded-lg border border-gray-700 ${className}`}>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-white">
              {currentStage?.name || 'Loading...'}
            </span>
            <span className="text-sm text-gray-400">{overall}%</span>
          </div>
          <Progress 
            value={overall} 
            className="h-2"
            style={{
              // @ts-expect-error - CSS custom properties are not typed
              '--progress-foreground': getProgressColor(overall, hasError)
            }}
          />
          {currentStage?.message && (
            <p className="text-xs text-gray-400 mt-1">{currentStage.message}</p>
          )}
        </div>
        {canCancel && onCancel && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            className="text-gray-400 hover:text-white"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className={`bg-gray-800 border-gray-700 ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <span className="flex items-center gap-2">
            {isLoading && <Loader2 className="h-5 w-5 animate-spin text-blue-400" />}
            {hasError && <AlertCircle className="h-5 w-5 text-red-400" />}
            {!isLoading && !hasError && <CheckCircle2 className="h-5 w-5 text-green-400" />}
            Loading Data
          </span>
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-gray-400">{overall}%</span>
            {canCancel && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onCancel}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress Bar */}
        <div>
                     <Progress 
             value={overall} 
             className="h-3"
             style={{
               // @ts-expect-error - CSS custom properties are not typed
               '--progress-foreground': getProgressColor(overall, hasError)
             }}
           />
          {currentStage && (
            <div className="flex items-center justify-between mt-2">
              <span className="text-sm text-gray-300">
                Current: {currentStage.name}
              </span>
              <span className="text-sm text-gray-400">
                {currentStage.message}
              </span>
            </div>
          )}
        </div>

        {/* Individual Stages */}
        {showStages && stages.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Progress Details:</h4>
            {stages.map((stage, index) => (
              <div key={stage.id} className="flex items-center gap-3 p-2 rounded bg-gray-700/50">
                <div className="flex-shrink-0">
                  {getStatusIcon(stage.status)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${getStatusColor(stage.status)}`}>
                      {stage.name}
                    </span>
                    <span className="text-xs text-gray-400">
                      {stage.status === 'completed' ? '100%' : `${stage.progress}%`}
                    </span>
                  </div>
                  {stage.status === 'loading' && (
                    <Progress 
                      value={stage.progress} 
                      className="h-1 mt-1"
                    />
                  )}
                  {stage.message && (
                    <p className="text-xs text-gray-400 mt-1 truncate" title={stage.message}>
                      {stage.message}
                    </p>
                  )}
                  {stage.error && (
                    <p className="text-xs text-red-400 mt-1" title={stage.error}>
                      Error: {stage.error}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error Summary */}
        {hasError && (
          <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <span className="text-sm font-medium text-red-400">
                Loading Error
              </span>
            </div>
            <p className="text-sm text-red-300 mt-1">
              Some data failed to load. You can try refreshing or continue with partial data.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default LoadingProgress; 