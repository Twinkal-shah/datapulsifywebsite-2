import React, { useState } from 'react';
import { lemonSqueezyService } from '@/lib/lemonSqueezyService';
import { useAuth } from '@/contexts/AuthContext';

const LemonSqueezyDebugTest: React.FC = () => {
  const { user } = useAuth();
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<string[]>([]);

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testEnvironmentVariables = () => {
    addResult('🔧 Testing Environment Variables...');
    
    const envVars = {
      storeId: import.meta.env.VITE_LEMONSQUEEZY_STORE_ID,
      apiKey: import.meta.env.VITE_LEMONSQUEEZY_API_KEY,
      variantLifetime: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_LIFETIME,
      variantMonthly: import.meta.env.VITE_LEMONSQUEEZY_VARIANT_MONTHLY,
      productId: import.meta.env.VITE_LEMONSQUEEZY_PRODUCT_ID,
      productionUrl: import.meta.env.VITE_PRODUCTION_URL
    };

    Object.entries(envVars).forEach(([key, value]) => {
      if (key === 'apiKey') {
        addResult(`${key}: ${value ? 'Present (hidden)' : 'MISSING'}`);
      } else {
        addResult(`${key}: ${value || 'MISSING'}`);
      }
    });
  };

  const testUserAuth = () => {
    addResult('👤 Testing User Authentication...');
    addResult(`User exists: ${!!user}`);
    addResult(`User email: ${user?.email || 'Not available'}`);
  };

  const testCheckoutCreation = async (planType: 'monthly' | 'lifetime') => {
    if (!user) {
      addResult('❌ Cannot test checkout - user not authenticated');
      return;
    }

    setTesting(true);
    addResult(`🛒 Testing ${planType} checkout creation...`);

    try {
      const result = await lemonSqueezyService.createCheckoutSession(planType, user.email);
      addResult(`✅ Checkout created successfully!`);
      addResult(`Checkout URL: ${result.checkoutUrl}`);
      addResult(`Checkout ID: ${result.checkoutId}`);
      
      // Don't redirect, just show the URL
      if (confirm(`Checkout URL created! Do you want to open it?\n\n${result.checkoutUrl}`)) {
        window.open(result.checkoutUrl, '_blank');
      }
    } catch (error) {
      addResult(`❌ Checkout creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      console.error('Full error:', error);
    } finally {
      setTesting(false);
    }
  };

  const clearResults = () => {
    setResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-gray-900 rounded-lg border border-gray-700">
      <h2 className="text-2xl font-bold text-white mb-6">🔍 LemonSqueezy Debug Test</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <button
          onClick={testEnvironmentVariables}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Test Environment Variables
        </button>
        
        <button
          onClick={testUserAuth}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          Test User Authentication
        </button>
        
        <button
          onClick={() => testCheckoutCreation('monthly')}
          disabled={testing || !user}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Monthly Checkout'}
        </button>
        
        <button
          onClick={() => testCheckoutCreation('lifetime')}
          disabled={testing || !user}
          className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:opacity-50"
        >
          {testing ? 'Testing...' : 'Test Lifetime Checkout'}
        </button>
        
        <button
          onClick={clearResults}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Clear Results
        </button>
      </div>

      <div className="bg-black rounded-lg p-4 max-h-96 overflow-y-auto">
        <h3 className="text-lg font-semibold text-white mb-3">Test Results:</h3>
        {results.length === 0 ? (
          <p className="text-gray-400">No tests run yet. Click a button above to start testing.</p>
        ) : (
          <div className="space-y-1">
            {results.map((result, index) => (
              <div key={index} className="text-sm font-mono text-green-400">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      {!user && (
        <div className="mt-4 p-4 bg-yellow-900 border border-yellow-600 rounded-lg">
          <p className="text-yellow-200">
            ⚠️ You need to be logged in to test checkout creation. Please sign in first.
          </p>
        </div>
      )}
    </div>
  );
};

export default LemonSqueezyDebugTest; 