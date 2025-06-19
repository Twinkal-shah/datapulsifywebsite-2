import React, { useState } from 'react';
import { lemonSqueezyService } from '@/lib/lemonSqueezyService';
import { useAuth } from '@/contexts/AuthContext';

const LemonSqueezyTest: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const testCheckout = async (plan: 'monthly' | 'lifetime') => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const checkoutData = await lemonSqueezyService.createCheckoutSession(plan, user.email);
      setSuccess(`Checkout URL created: ${checkoutData.checkoutUrl}`);
      console.log('Checkout URL:', checkoutData.checkoutUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create checkout session');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="p-4 border rounded-lg">
        <h3 className="text-lg font-semibold mb-2">LemonSqueezy Test</h3>
        <p className="text-gray-600">Please log in to test LemonSqueezy integration</p>
      </div>
    );
  }

  return (
    <div className="p-4 border rounded-lg">
      <h3 className="text-lg font-semibold mb-4">LemonSqueezy Integration Test</h3>
      
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 mb-2">User: {user.email}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => testCheckout('monthly')}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Test Monthly Checkout'}
          </button>
          
          <button
            onClick={() => testCheckout('lifetime')}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Creating...' : 'Test Lifetime Checkout'}
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            <strong>Error:</strong> {error}
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded">
            <strong>Success:</strong> {success}
          </div>
        )}
      </div>
    </div>
  );
};

export default LemonSqueezyTest; 