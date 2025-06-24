import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';
import { lemonSqueezyService } from '@/lib/lemonSqueezyService';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionOverlayProps {
  featureName: string;
  children: React.ReactNode;
}

export const SubscriptionOverlay: React.FC<SubscriptionOverlayProps> = ({
  featureName,
  children
}) => {
  const { isPremiumFeature, subscriptionEndDate, isInTrialPeriod, trialDaysLeft } = useSubscription();
  const { user } = useAuth();

  // If feature is accessible (not premium, active subscription, or in trial), render normally
  if (!isPremiumFeature(featureName)) {
    return <>{children}</>;
  }

  const handleUpgradeClick = () => {
    const checkoutUrl = lemonSqueezyService.getQuickCheckoutUrl('monthly', user?.email);
    window.location.href = checkoutUrl;
  };

  return (
    <div className="relative">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center p-6 bg-gray-800/90 rounded-lg max-w-md mx-4">
          <Lock className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">
            Premium Feature
          </h3>
          {subscriptionEndDate ? (
            // Expired subscription message
            <p className="text-gray-300 mb-4">
              Your subscription expired on {format(subscriptionEndDate, 'MMMM d, yyyy')}. 
              Renew now to regain access to all premium features.
            </p>
          ) : trialDaysLeft === 0 ? (
            // Expired trial message
            <p className="text-gray-300 mb-4">
              Your free trial has expired. 
              Upgrade to our Monthly Pro Plan to continue accessing premium features.
            </p>
          ) : (
            // New user message
            <p className="text-gray-300 mb-4">
              This feature is only available with the Monthly Pro Plan. 
              Upgrade now to unlock all premium features.
            </p>
          )}
          <Button 
            onClick={handleUpgradeClick}
            className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold"
          >
            {subscriptionEndDate ? 'Renew Subscription' : 'Upgrade to Pro'}
          </Button>
        </div>
      </div>
    </div>
  );
}; 