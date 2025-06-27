import { useState, useCallback, useRef } from 'react';

export interface LoadingStage {
  id: string;
  name: string;
  progress: number;
  status: 'pending' | 'loading' | 'completed' | 'error';
  message?: string;
  error?: string;
}

export interface LoadingProgress {
  overall: number;
  currentStage: LoadingStage | null;
  stages: LoadingStage[];
  isLoading: boolean;
  hasError: boolean;
  canCancel: boolean;
}

export interface UseProgressiveLoadingOptions {
  stages: Array<{ id: string; name: string; weight?: number }>;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
}

export function useProgressiveLoading(options: UseProgressiveLoadingOptions) {
  const { stages: stageDefinitions, onComplete, onError, onCancel } = options;
  
  const [stages, setStages] = useState<LoadingStage[]>(() =>
    stageDefinitions.map(stage => ({
      id: stage.id,
      name: stage.name,
      progress: 0,
      status: 'pending' as const,
      message: `Waiting to start ${stage.name}...`
    }))
  );

  const [isLoading, setIsLoading] = useState(false);
  const [canCancel, setCanCancel] = useState(false);
  const cancelTokenRef = useRef<{ cancelled: boolean }>({ cancelled: false });

  // Calculate overall progress
  const calculateOverallProgress = useCallback((currentStages: LoadingStage[]) => {
    const weights = stageDefinitions.map(s => s.weight || 1);
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    
    let weightedProgress = 0;
    currentStages.forEach((stage, index) => {
      const weight = weights[index] || 1;
      const stageProgress = stage.status === 'completed' ? 100 : stage.progress;
      weightedProgress += (stageProgress * weight) / totalWeight;
    });
    
    return Math.round(weightedProgress);
  }, [stageDefinitions]);

  // Get current progress state
  const getProgress = useCallback((): LoadingProgress => {
    const currentStage = stages.find(s => s.status === 'loading') || null;
    const hasError = stages.some(s => s.status === 'error');
    const overall = calculateOverallProgress(stages);
    
    return {
      overall,
      currentStage,
      stages,
      isLoading,
      hasError,
      canCancel
    };
  }, [stages, isLoading, canCancel, calculateOverallProgress]);

  // Update a specific stage
  const updateStage = useCallback((
    stageId: string, 
    update: Partial<Pick<LoadingStage, 'progress' | 'status' | 'message' | 'error'>>
  ) => {
    setStages(prev => prev.map(stage => 
      stage.id === stageId 
        ? { ...stage, ...update }
        : stage
    ));
  }, []);

  // Start loading process
  const startLoading = useCallback(() => {
    setIsLoading(true);
    setCanCancel(true);
    cancelTokenRef.current = { cancelled: false };
    
    // Reset all stages to pending
    setStages(prev => prev.map(stage => ({
      ...stage,
      progress: 0,
      status: 'pending' as const,
      message: `Waiting to start ${stage.name}...`,
      error: undefined
    })));
  }, []);

  // Complete loading process
  const completeLoading = useCallback(() => {
    setIsLoading(false);
    setCanCancel(false);
    
    // Mark all stages as completed
    setStages(prev => prev.map(stage => ({
      ...stage,
      progress: 100,
      status: 'completed' as const,
      message: `${stage.name} completed`
    })));
    
    onComplete?.();
  }, [onComplete]);

  // Handle error in loading process
  const errorLoading = useCallback((error: string, stageId?: string) => {
    setIsLoading(false);
    setCanCancel(false);
    
    if (stageId) {
      updateStage(stageId, { status: 'error', error });
    }
    
    onError?.(error);
  }, [onError, updateStage]);

  // Cancel loading process
  const cancelLoading = useCallback(() => {
    cancelTokenRef.current.cancelled = true;
    setIsLoading(false);
    setCanCancel(false);
    
    // Mark loading stages as pending
    setStages(prev => prev.map(stage => 
      stage.status === 'loading' 
        ? { ...stage, status: 'pending' as const, message: 'Cancelled' }
        : stage
    ));
    
    onCancel?.();
  }, [onCancel]);

  // Execute a stage with progress tracking
  const executeStage = useCallback(async <T>(
    stageId: string,
    operation: (
      updateProgress: (progress: number, message?: string) => void,
      cancelToken: { cancelled: boolean }
    ) => Promise<T>
  ): Promise<T> => {
    if (cancelTokenRef.current.cancelled) {
      throw new Error('Operation cancelled');
    }

    // Mark stage as loading
    updateStage(stageId, { status: 'loading', progress: 0, message: 'Starting...' });

    try {
      const updateProgress = (progress: number, message?: string) => {
        if (cancelTokenRef.current.cancelled) return;
        updateStage(stageId, { progress, message });
      };

      const result = await operation(updateProgress, cancelTokenRef.current);
      
      if (cancelTokenRef.current.cancelled) {
        throw new Error('Operation cancelled');
      }

      // Mark stage as completed
      updateStage(stageId, { status: 'completed', progress: 100, message: 'Completed' });
      
      return result;
    } catch (error) {
      if (cancelTokenRef.current.cancelled) {
        updateStage(stageId, { status: 'pending', message: 'Cancelled' });
        throw error;
      }
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      updateStage(stageId, { status: 'error', error: errorMessage });
      throw error;
    }
  }, [updateStage]);

  // Execute all stages in sequence
  const executeAllStages = useCallback(async (
    operations: Record<string, (
      updateProgress: (progress: number, message?: string) => void,
      cancelToken: { cancelled: boolean }
    ) => Promise<any>>
  ) => {
    startLoading();
    
    try {
      const results: Record<string, any> = {};
      
      for (const stage of stages) {
        if (cancelTokenRef.current.cancelled) {
          throw new Error('Operation cancelled');
        }
        
        const operation = operations[stage.id];
        if (operation) {
          results[stage.id] = await executeStage(stage.id, operation);
        }
      }
      
      completeLoading();
      return results;
    } catch (error) {
      if (cancelTokenRef.current.cancelled) {
        return null;
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      errorLoading(errorMessage);
      throw error;
    }
  }, [stages, startLoading, completeLoading, errorLoading, executeStage]);

  return {
    progress: getProgress(),
    startLoading,
    completeLoading,
    errorLoading,
    cancelLoading,
    updateStage,
    executeStage,
    executeAllStages,
    isCancelled: () => cancelTokenRef.current.cancelled
  };
} 