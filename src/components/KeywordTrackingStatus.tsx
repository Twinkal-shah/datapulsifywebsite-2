import React from 'react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { KeywordTrackingStats } from '@/hooks/useTrackedKeywords';

interface KeywordTrackingStatusProps {
  stats: KeywordTrackingStats;
  className?: string;
  showProgress?: boolean;
  showBadge?: boolean;
}

export const KeywordTrackingStatus: React.FC<KeywordTrackingStatusProps> = ({
  stats,
  className,
  showProgress = true,
  showBadge = true,
}) => {
  const { subscriptionType } = useSubscription();

  // Color scheme based on usage
  const getStatusColor = () => {
    if (stats.percentageUsed >= 100) return 'text-red-400';
    if (stats.percentageUsed >= 90) return 'text-yellow-400';
    if (stats.percentageUsed >= 75) return 'text-orange-400';
    return 'text-blue-400';
  };

  const getProgressColor = () => {
    if (stats.percentageUsed >= 100) return 'bg-red-500';
    if (stats.percentageUsed >= 90) return 'bg-yellow-500';
    if (stats.percentageUsed >= 75) return 'bg-orange-500';
    return 'bg-blue-500';
  };

  const getBadgeVariant = () => {
    if (stats.percentageUsed >= 100) return 'destructive';
    if (stats.percentageUsed >= 90) return 'secondary';
    return 'outline';
  };

  const getStatusText = () => {
    // Handle unlimited case for Monthly Pro
    if (stats.limit === Infinity) return 'Unlimited';
    if (stats.percentageUsed >= 100) return 'Limit reached';
    if (stats.percentageUsed >= 90) return 'Near limit';
    if (stats.percentageUsed >= 75) return 'High usage';
    return 'Active';
  };

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className={cn('font-medium text-xl flex items-baseline', getStatusColor())}>
            {stats.totalTracked}/{stats.limit === Infinity ? <span className="text-[1.3rem]">∞</span> : stats.limit} 
          </span>
          {showBadge && (
            <Badge variant={getBadgeVariant()} className={cn(
              "text-xs",
              stats.limit === Infinity ? "text-white bg-blue-600 border-blue-600" : ""
            )}>
              {getStatusText()}
            </Badge>
          )}
        </div>
        
        {subscriptionType === 'lifetime' && stats.percentageUsed >= 90 && (
          <span className="text-xs text-gray-400">
            Upgrade to Monthly Pro for unlimited keywords
          </span>
        )}
      </div>

      {showProgress && (
        <div className="space-y-1">
          <Progress 
            value={stats.limit === Infinity ? 0 : Math.min(stats.percentageUsed, 100)} 
            className="h-2 bg-gray-700"
          />
          <div className="flex justify-between text-xs text-gray-400">
            <span>{stats.limit === Infinity ? <><span className="text-base">∞</span> remaining</> : `${stats.remaining} remaining`}</span>
            <span>{stats.limit === Infinity ? <><span className="text-base">∞</span> available</> : `${Math.round(stats.percentageUsed)}% used`}</span>
          </div>
        </div>
      )}
    </div>
  );
}; 