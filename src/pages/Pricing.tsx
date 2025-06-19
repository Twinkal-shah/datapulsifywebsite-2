import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check } from 'lucide-react';
import LemonSqueezyCheckout from '@/components/LemonSqueezyCheckout';
import LemonSqueezyDebugTest from '@/components/LemonSqueezyDebugTest';
import { Button } from '@/components/ui/button';

const Pricing: React.FC = () => {
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'lifetime'>('monthly');
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

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

        {/* Debug Toggle */}
        <div className="mb-6 text-center">
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition-colors"
          >
            {showDebug ? '🔧 Hide Debug Panel' : '🔧 Show Debug Panel'}
          </button>
        </div>

        {/* Debug Panel */}
        {showDebug && (
          <div className="mb-8">
            <LemonSqueezyDebugTest />
          </div>
        )}

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
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-white text-center mb-12">
            Frequently Asked Questions
          </h2>
          
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What's included in the Monthly Pro plan?
                </h3>
                <p className="text-gray-400">
                  Unlimited keyword tracking, advanced analytics, data export capabilities, 
                  and priority customer support. Cancel anytime with no long-term commitment.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  How does the Lifetime Deal work?
                </h3>
                <p className="text-gray-400">
                  Pay once and get access to all premium features forever. Includes all 
                  future updates and no recurring fees. Perfect for long-term SEO professionals.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Can I cancel my subscription?
                </h3>
                <p className="text-gray-400">
                  Yes, you can cancel your Monthly Pro subscription at any time. 
                  Your access will continue until the end of your current billing period.
                </p>
              </div>
            </div>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Is there a money-back guarantee?
                </h3>
                <p className="text-gray-400">
                  Yes, we offer a 60-day money-back guarantee on all plans. 
                  If you're not satisfied, we'll refund your payment in full.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  What payment methods do you accept?
                </h3>
                <p className="text-gray-400">
                  We accept all major credit cards, PayPal, and other secure payment 
                  methods through our payment processor LemonSqueezy.
                </p>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-white mb-2">
                  Do you offer refunds?
                </h3>
                <p className="text-gray-400">
                  Yes, we provide full refunds within 60 days of purchase if you're 
                  not completely satisfied with DataPulsify.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Support Section */}
      <div className="border-t border-gray-800">
        <div className="container mx-auto px-4 py-12 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">
            Need Help Choosing?
          </h3>
          <p className="text-gray-400 mb-6">
            Our team is here to help you select the perfect plan for your needs.
          </p>
          <Link to="/contact-us">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-800">
              Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Pricing; 