import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Crown, Zap, Star, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { lemonSqueezyService, PLANS } from '@/lib/lemonSqueezyService';
import { toast } from '@/hooks/use-toast';

interface LemonSqueezyCheckoutProps {
  defaultPlan?: 'lifetime' | 'monthly';
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

export const LemonSqueezyCheckout: React.FC<LemonSqueezyCheckoutProps> = ({
  defaultPlan = 'monthly',
  onSuccess,
  onError
}) => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'lifetime' | 'monthly'>(defaultPlan);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async (planType: 'monthly' | 'lifetime') => {
    console.log('🚀 handleCheckout called with:', { 
      planType, 
      user: user?.email,
      userExists: !!user 
    });
    
    // Debug environment variables
    console.log('🔧 Environment variables:', {
      storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID,
      apiKey: import.meta.env.VITE_LEMONSQUEEZY_API_KEY ? 'Present' : 'Missing',
      variantLifetime: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME,
      variantMonthly: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_MONTHLY,
      productId: import.meta.env.VITE_LEMONSQUEEZY_PRODUCT_ID
    });
    
    if (!user) {
      const errorMsg = 'Please sign in to continue with your purchase';
      console.error('❌ User not authenticated');
      setError(errorMsg);
      toast({
        title: "Authentication Required",
        description: errorMsg,
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    setLoadingPlan(planType);
    setError(null);

    try {
      console.log('📞 About to call createCheckoutSession...');
      const checkoutData = await lemonSqueezyService.createCheckoutSession(planType, user.email);
      console.log('✅ Checkout data received:', checkoutData);
      
      if (!checkoutData.checkoutUrl) {
        throw new Error('No checkout URL received from payment processor');
      }
      
      console.log('🌐 Redirecting to:', checkoutData.checkoutUrl);
      
      // Add a small delay to ensure logs are visible
      setTimeout(() => {
        window.location.href = checkoutData.checkoutUrl;
      }, 100);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      console.error('💥 Checkout error details:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        stack: err instanceof Error ? err.stack : 'No stack trace'
      });
      
      const errorMessage = err instanceof Error ? err.message : 'Failed to create checkout session';
      setError(errorMessage);
      
      toast({
        title: "Checkout Error",
        description: errorMessage,
        variant: "destructive",
      });

      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setLoadingPlan(null);
    }
  };

  const lifetimeFeatures = [
    "Unlimited keyword tracking",
    "Advanced analytics & reporting",
    "Data export capabilities",
    "Priority customer support",
    "All future updates included",
    "One-time payment - no recurring fees"
  ];

  const monthlyFeatures = [
    "Unlimited keyword tracking",
    "Advanced analytics & reporting", 
    "Data export capabilities",
    "Priority customer support",
    "Cancel anytime"
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-4">
          Choose Your DataPulsify Plan
        </h2>
        <p className="text-gray-400 text-lg">
          Unlock all premium features and take your SEO to the next level
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Monthly Pro Plan */}
        <Card className={`relative bg-[#1a1d23] border-2 transition-all duration-300 ${
          selectedPlan === 'monthly' 
            ? 'border-blue-500 shadow-lg shadow-blue-500/20' 
            : 'border-gray-700 hover:border-gray-600'
        }`}>
          <CardHeader className="text-center pb-4">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full">
                <Crown className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Monthly Pro</CardTitle>
            <CardDescription className="text-gray-400">
              Perfect for ongoing SEO campaigns
            </CardDescription>
            <div className="flex items-center justify-center mt-4">
              <span className="text-4xl font-bold text-white">${PLANS.monthly.price}</span>
              <span className="text-gray-400 ml-2">/month</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {monthlyFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleCheckout('monthly')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg font-semibold transition-all duration-300"
            >
              {loadingPlan === 'monthly' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Start Monthly Pro'
              )}
            </Button>
            <p className="text-sm text-gray-400 text-center">
              Cancel anytime • No long-term commitment
            </p>
          </CardContent>
        </Card>

        {/* Lifetime Deal */}
        <Card className={`relative bg-[#1a1d23] border-2 transition-all duration-300 ${
          selectedPlan === 'lifetime' 
            ? 'border-yellow-500 shadow-lg shadow-yellow-500/20' 
            : 'border-gray-700 hover:border-gray-600'
        }`}>
          {/* Popular Badge */}
          <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
            <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-black font-bold px-4 py-1">
              🔥 BEST VALUE
            </Badge>
          </div>
          
          <CardHeader className="text-center pb-4 pt-8">
            <div className="flex items-center justify-center mb-4">
              <div className="p-3 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full">
                <Star className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-2xl text-white">Lifetime Deal</CardTitle>
            <CardDescription className="text-gray-400">
              Pay once, own forever
            </CardDescription>
            <div className="flex items-center justify-center mt-4">
              <span className="text-lg text-gray-400 line-through mr-3">
                ${(PLANS.monthly.price * 12).toFixed(2)}/year
              </span>
            </div>
            <div className="flex items-center justify-center">
              <span className="text-4xl font-bold text-white">${PLANS.lifetime.price}</span>
              <span className="text-gray-400 ml-2">once</span>
            </div>
            <p className="text-green-400 font-semibold mt-2">
              Save ${((PLANS.monthly.price * 12) - PLANS.lifetime.price).toFixed(2)} in year 1
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {lifetimeFeatures.map((feature, index) => (
                <div key={index} className="flex items-start">
                  <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{feature}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => handleCheckout('lifetime')}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-black py-6 text-lg font-semibold transition-all duration-300"
            >
              {loadingPlan === 'lifetime' ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Get Lifetime Access'
              )}
            </Button>
            <p className="text-sm text-gray-400 text-center">
              60-day money-back guarantee • One-time payment
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Trust Indicators */}
      <div className="mt-12 text-center">
        <div className="flex flex-wrap justify-center items-center gap-8 text-gray-400">
          <div className="flex items-center">
            <Zap className="w-5 h-5 mr-2 text-yellow-400" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center">
            <Check className="w-5 h-5 mr-2 text-green-400" />
            <span>60-Day Guarantee</span>
          </div>
          <div className="flex items-center">
            <Crown className="w-5 h-5 mr-2 text-purple-400" />
            <span>Premium Support</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LemonSqueezyCheckout; 