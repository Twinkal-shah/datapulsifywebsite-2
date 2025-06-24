import { Button } from './ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { lemonSqueezyService } from '@/lib/lemonSqueezyService';
import { useToast } from '@/hooks/use-toast';

interface UpgradeOverlayProps {
  isVisible: boolean;
}

export function UpgradeOverlay({ isVisible }: UpgradeOverlayProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  if (!isVisible) return null;

  const handleUpgradeClick = async () => {
    if (!user?.email) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to continue with your purchase",
        variant: "destructive",
      });
      return;
    }

    try {
      const checkoutData = await lemonSqueezyService.createCheckoutSession('monthly', user.email);
      window.location.href = checkoutData.checkoutUrl;
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Checkout Error",
        description: error instanceof Error ? error.message : 'Failed to create checkout session',
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 backdrop-blur-md bg-black/50 flex items-center justify-center">
      <div className="bg-[#1a1d23] p-8 rounded-2xl max-w-lg w-full mx-4 text-center space-y-6 border border-gray-700">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mx-auto flex items-center justify-center">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-white">Your Free Trial Has Ended</h2>
        <p className="text-gray-400">
          Thank you for trying Datapulsify! To continue accessing all features and insights,
          please upgrade to our premium plan.
        </p>
        <div className="space-y-4">
          <Button 
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:opacity-90"
            onClick={handleUpgradeClick}
          >
            Upgrade Now
          </Button>
          <p className="text-sm text-gray-500">
            Get access to all features, unlimited searches, and priority support.
          </p>
        </div>
      </div>
    </div>
  );
} 