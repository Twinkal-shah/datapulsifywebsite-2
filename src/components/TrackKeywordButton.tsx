import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { Loader2, Plus, X, Eye, TrendingUp } from 'lucide-react';

interface TrackKeywordButtonProps {
  keyword: string;
  isTracked: boolean;
  onTrack: (keyword: string) => Promise<boolean>;
  disabled?: boolean;
  variant?: 'button' | 'badge' | 'compact';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showIcon?: boolean;
}

export const TrackKeywordButton: React.FC<TrackKeywordButtonProps> = ({
  keyword,
  isTracked,
  onTrack,
  disabled = false,
  variant = 'button',
  size = 'sm',
  className,
  showIcon = true,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async (e?: React.MouseEvent) => {
    // Prevent event bubbling and double clicks
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (isLoading || disabled || isTracked) return; // Don't allow clicking if already tracked

    setIsLoading(true);
    try {
      const success = await onTrack(keyword);
      
      // Ensure loading state clears even if the operation was instant
      if (success) {
        // Small delay to show the loading state briefly for user feedback
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    } catch (error) {
      console.error('Error in track operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Badge variant - compact tracked status
  if (variant === 'badge') {
    return (
      <Badge 
        variant={isTracked ? "default" : "outline"}
        className={cn(
          "transition-all duration-200",
          isTracked 
            ? "bg-green-900/30 text-green-400 border-green-700 cursor-default" 
            : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-blue-500 hover:text-blue-400 cursor-pointer hover:scale-105",
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={isTracked ? undefined : handleClick}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            {showIcon && (
              <>
                {isTracked ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <Plus className="h-3 w-3 mr-1" />
                )}
              </>
            )}
            {isTracked ? 'Tracked' : 'Track'}
          </>
        )}
      </Badge>
    );
  }

  // Compact variant - minimal button
  if (variant === 'compact') {
    return (
      <Button
        variant="ghost"
        size="sm"
        disabled={disabled || isLoading}
        onClick={handleClick}
        className={cn(
          "h-6 w-6 p-0 rounded-full transition-all duration-200",
          isTracked 
            ? "text-green-400 hover:text-green-300 hover:bg-green-900/20" 
            : "text-gray-400 hover:text-blue-400 hover:bg-blue-900/20",
          className
        )}
      >
        {isLoading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : (
          <>
            {isTracked ? (
              <Eye className="h-3 w-3" />
            ) : (
              <Plus className="h-3 w-3" />
            )}
          </>
        )}
      </Button>
    );
  }

  // Default button variant
  const buttonSize = size === 'sm' ? 'sm' : size === 'lg' ? 'lg' : 'default';

  return (
    <Button
      variant={isTracked ? "default" : "outline"}
      size={buttonSize}
      disabled={disabled || isLoading}
      onClick={handleClick}
      className={cn(
        "transition-all duration-200",
        isTracked 
          ? "bg-green-900/30 text-green-400 border-green-700 hover:bg-green-900/50 hover:border-green-600" 
          : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:border-blue-500 hover:text-blue-400",
        className
      )}
    >
      {isLoading ? (
        <Loader2 className={cn(
          "animate-spin",
          size === 'sm' ? "h-3 w-3" : "h-4 w-4",
          showIcon && "mr-2"
        )} />
      ) : (
        <>
          {showIcon && (
            <>
              {isTracked ? (
                <TrendingUp className={cn(
                  size === 'sm' ? "h-3 w-3" : "h-4 w-4",
                  "mr-2"
                )} />
              ) : (
                <Plus className={cn(
                  size === 'sm' ? "h-3 w-3" : "h-4 w-4",
                  "mr-2"
                )} />
              )}
            </>
          )}
          {isTracked ? 'Tracked' : 'Track'}
        </>
      )}
    </Button>
  );
}; 