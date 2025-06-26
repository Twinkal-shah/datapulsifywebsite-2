import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Star, MessageSquare, Puzzle, Loader2 } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { supabase } from '@/lib/supabaseClient';

interface PurchaseDetails {
  subscription_type: string;
  payment_status: string;
  subscription_status: string;
  subscription_start_date: string | null;
  subscription_end_date: string | null;
  next_billing_date: string | null;
  lemonsqueezy_customer_id: string | null;
  amount: number | null;
}

// Pricing mapping for different subscription types
const PRICING_MAP: Record<string, string> = {
  'lifetime': '$49.99',
  'monthly_pro': '$9.99/month',
  'Free Plan': '$0.00',
  'free': '$0.00'
};

// Plan display names
const PLAN_NAMES: Record<string, string> = {
  'lifetime': 'Lifetime Deal',
  'monthly_pro': 'Monthly Pro',
  'Free Plan': 'Free Plan',
  'free': 'Free Plan'
};

const ThankYou = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { 
    subscriptionType, 
    paymentStatus, 
    subscriptionStatus, 
    nextBillingDate,
    checkSubscriptionStatus,
    isLoading: subscriptionLoading 
  } = useSubscription();
  
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [detailsLoading, setDetailsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch detailed purchase information
  const fetchPurchaseDetails = async () => {
    if (!user?.email) {
      setDetailsLoading(false);
      return;
    }

    try {
      setDetailsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('user_installations')
        .select(`
          subscription_type,
          payment_status,
          subscription_status,
          subscription_start_date,
          subscription_end_date,
          next_billing_date,
          lemonsqueezy_customer_id,
          amount
        `)
        .eq('email', user.email)
        .single();

      if (fetchError) {
        console.error('Error fetching purchase details:', fetchError);
        setError('Unable to load purchase details');
        return;
      }

      if (data) {
        setPurchaseDetails(data);
      }
    } catch (err) {
      console.error('Error in fetchPurchaseDetails:', err);
      setError('Unable to load purchase details');
    } finally {
      setDetailsLoading(false);
    }
  };

  useEffect(() => {
    // Refresh subscription status when component mounts
    if (user && !authLoading) {
      checkSubscriptionStatus();
      fetchPurchaseDetails();
    }
  }, [user, authLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (user && (paymentStatus === 'paid' || subscriptionStatus === 'active')) {
        toast({
          title: "Purchase Successful! 🎉",
          description: "Welcome to Datapulsify. Your account is now active."
        });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, paymentStatus, subscriptionStatus]);

  // Show loading state while fetching data
  if (authLoading || subscriptionLoading || detailsLoading) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
        <Navbar />
        <main className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-white mx-auto mb-4" />
            <p className="text-white">Loading your purchase details...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Redirect to home if no user is logged in
  if (!user) {
    navigate('/');
    return null;
  }

  // Get display values
  const planType = purchaseDetails?.subscription_type || subscriptionType || 'Free Plan';
  const planName = PLAN_NAMES[planType] || planType;
  const amount = purchaseDetails?.amount 
    ? `$${purchaseDetails.amount.toFixed(2)}${planType === 'monthly_pro' ? '/month' : ''}`
    : PRICING_MAP[planType] || 'N/A';
  const status = purchaseDetails?.payment_status || paymentStatus;
  const subStatus = purchaseDetails?.subscription_status || subscriptionStatus;
  
  // Determine expiration
  let expiration = 'Active';
  if (planType === 'lifetime') {
    expiration = status === 'paid' ? 'Never' : 'Pending Payment';
  } else if (planType === 'monthly_pro') {
    if (purchaseDetails?.subscription_end_date || nextBillingDate) {
      const endDate = purchaseDetails?.subscription_end_date || nextBillingDate;
      expiration = endDate ? new Date(endDate).toLocaleDateString() : 'Active';
    }
  } else {
    expiration = 'N/A';
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-20 md:py-28">
          <div className="container-section">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={40} className="text-green-500" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Thank You for Your Purchase!
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                {planType === 'lifetime' && status === 'paid' 
                  ? 'Your Datapulsify Lifetime Deal is now active. You have full access to all premium features forever!'
                  : planType === 'monthly_pro' && subStatus === 'active'
                  ? 'Your Datapulsify Monthly Pro subscription is now active. Enjoy unlimited access!'
                  : 'Thank you for choosing Datapulsify. Your purchase is being processed.'
                }
              </p>
              
              <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">Your Purchase Details</h2>
                
                {error ? (
                  <div className="text-red-400 text-center py-4">
                    {error}
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-gray-800 py-3">
                      <span className="text-gray-300">Plan</span>
                      <span className="font-medium">{planName}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-800 py-3">
                      <span className="text-gray-300">Amount</span>
                      <span className="font-medium">{amount}</span>
                    </div>
                    {status && (
                      <div className="flex justify-between items-center border-b border-gray-800 py-3">
                        <span className="text-gray-300">Payment Status</span>
                        <span className={`font-medium capitalize ${
                          status === 'paid' ? 'text-green-500' : 
                          status === 'pending' ? 'text-yellow-500' : 
                          'text-red-500'
                        }`}>
                          {status}
                        </span>
                      </div>
                    )}
                    {purchaseDetails?.subscription_start_date && (
                      <div className="flex justify-between items-center border-b border-gray-800 py-3">
                        <span className="text-gray-300">Started</span>
                        <span className="font-medium">
                          {new Date(purchaseDetails.subscription_start_date).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-3">
                      <span className="text-gray-300">Expiration</span>
                      <span className={`font-medium ${
                        expiration === 'Never' ? 'text-green-500' : 
                        expiration === 'Pending Payment' ? 'text-yellow-500' : 
                        'text-white'
                      }`}>
                        {expiration}
                      </span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="flex flex-col md:flex-row justify-center gap-4 mb-12">
                <Link to="/dashboard" className="btn-primary py-3 px-8">
                  Go to Dashboard
                </Link>
                <Link to="/support" className="btn-secondary py-3 px-8">
                  Need Help?
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <MessageSquare className="text-green-400" size={28} />
                    </div>
                    <h3 className="text-xl font-medium mb-3 text-center text-white">
                      Join our WhatsApp Community
                    </h3>
                    <p className="text-gray-300 mb-4 text-center">
                      Connect with other Datapulsify users and share insights
                    </p>
                    <a 
                      href="https://chat.whatsapp.com/Jw6j4yiBrIvK12gUIOl5Q0"
 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full py-2 px-4 btn-secondary btn-secondary:hover text-center rounded-md transition-colors"
                    >
                      Join Now
                    </a>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <Puzzle className="text-blue-400" size={28} />
                    </div>
                    <h3 className="text-xl font-medium mb-3 text-center text-white">
                      Explore Add-ons
                    </h3>
                    <p className="text-gray-300 mb-4 text-center">
                      Enhance your experience with our powerful add-ons
                    </p>
                    <Link 
                      to="https://workspace.google.com/marketplace/app/datapulsify/122846135742" 
                      className="block w-full py-2 px-4 btn-secondary btn-secondary:hover text-center rounded-md transition-colors"
                    >
                      Browse Add-ons
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ThankYou;