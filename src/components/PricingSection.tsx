
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Check, Info, MessageCircle, X } from 'lucide-react';

const PricingSection = () => {
  return (
    <section id="pricing" className="gradient-bg py-14 md:py-20 lg:py-24">
      <div className="container-section">
        <h2 className="section-title">Simple, Transparent Pricing</h2>
        <p className="section-subtitle">
          Choose the plan that's right for you. No hidden fees, no commitments.
        </p>

        <div className="mt-6 mb-8 md:mt-8 md:mb-12 text-center">
          <div className="inline-block bg-white/10 backdrop-blur-sm p-1 rounded-full">
            <Badge variant="outline" className="py-1.5 px-3 md:py-2 md:px-4 text-white border-white/30 bg-white/5 rounded-full text-xs md:text-sm">
              <span className="font-semibold">Limited Time Offer:</span> 
              <span className="ml-1">Free full access for the first 100 users!</span>
            </Badge>
          </div>
        </div>

        <div className=" md:mt-16 p-5 md:p-8 border border-white/20 rounded-2xl bg-black/50 backdrop-blur-sm text-center max-w-3xl mx-auto opacity-0 animate-fade-in animate-delay-500 mb-12">
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Early Access to First 100 Users
          </h3>
          <p className="text-sm md:text-base text-gray-300 mb-5 md:mb-6">
          You’ll get full and unlimited access to everything including priority support, in return we need your valuable feedback to improve our solution.
          .
          </p>
          <a href="#" className="inline-flex items-center btn-secondary text-sm md:text-base">
            <MessageCircle size={16} className="mr-2" />
            Get your early access
          </a>
        
          <p className="text-sm md:text-base text-gray-300 mb-5 md:mb-6 pt-4">Seats are filling out fast, only 20 seats left…
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Free for first 100 users plan */}
          {/* <div className="border border-white/10 bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden transition-all hover:border-white/30 hover:translate-y-[-5px] opacity-0 animate-fade-in">
            <div className="p-5 md:p-6 border-b border-gray-800">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Early Access</h3>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">For the first 100 users</p>
              <div className="flex items-baseline mb-1">
                <span className="text-2xl md:text-3xl font-bold">$0</span>
                <span className="text-gray-400 ml-2 text-sm md:text-base">/month</span>
              </div>
              <p className="text-xs md:text-sm text-gray-300">Full access to all features</p>
            </div>
            <div className="p-5 md:p-6">
              <ul className="space-y-2 md:space-y-3 mb-5 md:mb-6 text-sm md:text-base">
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Unlimited queries</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Full feature access</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Priority support</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Early access to new features</span>
                </li>
              </ul>
              <a href="#" className="btn-primary w-full text-center">Get Started</a>
            </div>
          </div> */}

          {/* Free plan */}
          <div className="border border-white/10 bg-black/30 backdrop-blur-sm rounded-2xl overflow-hidden transition-all hover:border-white/30 hover:translate-y-[-5px] opacity-0 animate-fade-in animate-delay-150">
            <div className="p-5 md:p-6 border-b border-gray-800">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Free</h3>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">After 100 users</p>
              <div className="flex items-baseline mb-1">
                <span className="text-2xl md:text-3xl font-bold">$0</span>
                <span className="text-gray-400 ml-2 text-sm md:text-base">/month</span>
              </div>
              <p className="text-xs md:text-sm text-gray-300">Limited rows, basic features</p>
            </div>
            <div className="p-5 md:p-6">
              <ul className="space-y-2 md:space-y-3 mb-5 md:mb-6 text-sm md:text-base">
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Up to 10,000 rows</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Basic GSC data access</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Community support</span>
                </li>
                <li className="flex items-start text-gray-500">
                  <X size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>SEO Insights</span>
                </li>
                <li className="flex items-start text-gray-500">
                  <X size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Rank Tracker</span>
                </li>
                <li className="flex items-start text-gray-500">
                  <X size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <span>Gap Analysis</span>
                </li>
               
              </ul>
              <a href="#" className="btn-secondary w-full text-center">Sign Up</a>
            </div>
          </div>

          {/* Pro plan */}
          <div className="border border-white backdrop-blur-md rounded-2xl overflow-hidden shadow-xl shadow-white/5 transition-all hover:translate-y-[-5px] relative z-10 opacity-0 animate-fade-in animate-delay-300">
            <div className="absolute top-0 right-0 bg-white text-black py-1 px-2 text-xs font-semibold rounded-bl-lg">
              POPULAR
            </div>
            <div className="p-5 md:p-6 border-b border-gray-800">
              <h3 className="text-lg md:text-xl font-bold mb-1 md:mb-2">Pro</h3>
              <p className="text-xs md:text-sm text-gray-400 mb-3 md:mb-4">For professionals</p>
              <div className="flex items-baseline mb-1">
                <span className="text-2xl md:text-3xl font-bold">$9</span>
                <span className="text-gray-400 ml-2 text-sm md:text-base">/month</span>
              </div>
              <p className="text-xs md:text-sm text-gray-300">Unlimited rows & all features</p>
            </div>
            <div className="p-5 md:p-6">
              <ul className="space-y-2 md:space-y-3 mb-5 md:mb-6 text-sm md:text-base">
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Everything included in the free plan</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Unlimited rows</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Community support</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>SEO Insights</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Rank Tracker</span>
                </li>
                <li className="flex items-start">
                  <Check size={16} className="mr-2 mt-0.5 text-white flex-shrink-0" />
                  <span>Gap Analysis</span>
                </li>
              </ul>
              <a href="#" className="btn-primary w-full text-center">Start free trial</a>
              {/* <p className="text-sm md:text-base text-gray-300 text-center pt-2">No credit card required
          </p> */}
          <div className="text-xs md:text-sm text-gray-400 animate-fade-in animate-delay-500 pt-2 text-center">
              No credit card required
            </div>
            </div>
          </div>
        </div>

        {/* Enterprise Section */}
        <div className="mt-10 md:mt-16 p-5 md:p-8 border border-white/20 rounded-2xl bg-black/50 backdrop-blur-sm text-center max-w-3xl mx-auto opacity-0 animate-fade-in animate-delay-500">
          <h3 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Enterprise Plan</h3>
          <p className="text-sm md:text-base text-gray-300 mb-5 md:mb-6">
            Need custom integrations, API access, or team support? Contact us for enterprise pricing.
          </p>
          <Link to="/contactus" className="inline-flex items-center btn-secondary text-sm md:text-base">
  <MessageCircle size={16} className="mr-2" />
  Contact Us for Pricing
</Link>
        </div>
        
      </div>
    </section>
  );
};

export default PricingSection;
