import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import LemonSqueezyCheckout from '@/components/LemonSqueezyCheckout';
import { Button } from '@/components/ui/button';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const handleCheckoutSuccess = () => {
    setCheckoutSuccess(true);
    setCheckoutError(null);
  };

  const handleCheckoutError = (error: string) => {
    setCheckoutError(error);
    setCheckoutSuccess(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <div className="container mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/dashboard" 
            className="flex items-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold text-white">Upgrade Your Plan</h1>
          <div className="w-24"></div> {/* Spacer for centering */}
        </div>

        {/* Success/Error Messages */}
        {checkoutSuccess && (
          <div className="mb-6 p-4 bg-green-900 border border-green-600 rounded-lg">
            <p className="text-green-200">✅ Checkout initiated successfully! You should be redirected to LemonSqueezy.</p>
          </div>
        )}

        {checkoutError && (
          <div className="mb-6 p-4 bg-red-900 border border-red-600 rounded-lg">
            <p className="text-red-200">❌ Checkout Error: {checkoutError}</p>
          </div>
        )}

        {/* Main Checkout Component */}
        <LemonSqueezyCheckout
          defaultPlan={selectedPlan}
          onSuccess={handleCheckoutSuccess}
          onError={handleCheckoutError}
        />
      </div>

      {/* FAQ Section */}
      <div className="container mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold text-white mb-8">Frequently Asked Questions</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">What's included in the plan?</h3>
            <p className="text-gray-300">Our plan includes full access to all features, including keyword tracking, performance analytics, and custom reports. You'll also get priority support and early access to new features.</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Can I cancel anytime?</h3>
            <p className="text-gray-300">Yes, you can cancel your subscription at any time. If you cancel, you'll continue to have access until the end of your current billing period.</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Is there a free trial?</h3>
            <p className="text-gray-300">Yes! We offer a 14-day free trial so you can test all our features and see how Datapulsify can help your business grow.</p>
          </div>
          <div className="bg-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-3">What payment methods do you accept?</h3>
            <p className="text-gray-300">We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. All payments are processed securely through LemonSqueezy.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 