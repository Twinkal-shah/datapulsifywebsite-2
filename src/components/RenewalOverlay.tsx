import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { Lock } from 'lucide-react';

interface RenewalOverlayProps {
  children: React.ReactNode;
}

export const RenewalOverlay: React.FC<RenewalOverlayProps> = ({ children }) => {
  const { isSubscriptionActive, subscriptionEndDate, isInTrialPeriod } = useSubscription();

  // Only show content if subscription is active or in trial period
  // This ensures expired subscriptions don't get access
  if (isSubscriptionActive || isInTrialPeriod) {
    return <>{children}</>;
  }

  // If we reach here, either:
  // 1. Subscription has expired (subscriptionEndDate exists but isSubscriptionActive is false)
  // 2. User never had a subscription
  // 3. Trial has ended
  return (
    <div className="relative h-full">
      {/* Blurred content */}
      <div className="filter blur-sm pointer-events-none">
        {children}
      </div>

      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center">
        <div className="text-center p-8 bg-gray-800/90 rounded-xl max-w-lg mx-4 shadow-2xl border border-gray-700">
          <Lock className="w-16 h-16 text-yellow-500 mx-auto mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">
            Premium Access Required
          </h2>
          {subscriptionEndDate ? (
            // Expired subscription message
            <p className="text-gray-300 mb-6 text-lg">
              Your Monthly Pro Plan expired on {format(subscriptionEndDate, 'MMMM d, yyyy')}. 
              Renew now to regain access to all premium features and continue tracking your rankings.
            </p>
          ) : (
            // New user message
            <p className="text-gray-300 mb-6 text-lg">
              This feature requires an active Monthly Pro Plan subscription. 
              Upgrade now to access all premium features and start tracking your rankings.
            </p>
          )}
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = '/pricing'}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-black font-semibold px-8 py-6 text-lg w-full"
            >
              {subscriptionEndDate ? 'Renew Subscription' : 'Upgrade to Pro'}
            </Button>
            <p className="text-sm text-gray-400">
              Get unlimited access to all premium features with our Monthly Pro Plan
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}; 