
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Check, AlertTriangle, Star, Shield, Clock, Zap,Info, MessageCircle, X } from 'lucide-react';
import LottieBackground from './LottieBackground';

const PricingSection = () => {
  const features = [
    "Both platforms included (Sheets + Dashboard)",
    "25,000 rows capacity (perfect for most sites)", 
    "Smart data analysis & recommendations",
    "Professional visualizations",
    "All future updates included",
    "Standard support"
  ];

  return (
    <section id="pricing" className="py-20 md:py-32 bg-black relative overflow-hidden">
      {/* Lottie Background Animation */}
      <LottieBackground className="z-0" />
      
      <div className="container-section relative z-10">
        <h2 className="section-title">One Price. Two Platforms. Lifetime Access.</h2>
        
        <div className="max-w-4xl mx-auto">
          {/* Value Proposition */}
          <div className="text-center mb-12">
            <div className="grid sm:grid-cols-3 gap-6 max-w-2xl mx-auto mb-8">
              <div className="text-center">
                <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="font-semibold">Save 15+ hours/month</div>
                <div className="text-sm text-gray-400">No more manual data wrestling</div>
              </div>
              <div className="text-center">
                <Star className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="font-semibold">Impress stakeholders</div>
                <div className="text-sm text-gray-400">Professional reports & insights</div>
              </div>
              <div className="text-center">
                <Check className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="font-semibold">Find more opportunities</div>
                <div className="text-sm text-gray-400">Smart analysis & recommendations</div>
              </div>
            </div>
          </div>

          {/* Lifetime Deal Box */}
          <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 border-2 border-blue-500/50 rounded-2xl overflow-hidden shadow-2xl relative mb-12">
            {/* Badge */}
            <div className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-orange-500 text-black py-2 px-6 text-sm font-bold rounded-bl-2xl">
              🚀 LIFETIME DEAL
            </div>
            
            <div className="p-8 md:p-12">
              <div className="text-center mb-8">
                <h3 className="text-3xl md:text-4xl font-bold mb-4">Complete DataPulsify Access</h3>
                
                {/* Pricing */}
                <div className="flex items-center justify-center mb-6">
                  <span className="text-2xl text-gray-400 line-through mr-4">$564/year</span>
                  <span className="text-5xl md:text-6xl font-bold text-white">$47.99</span>
                  <span className="text-xl text-gray-300 ml-3">Once</span>
                </div>
                
                <p className="text-lg text-green-400 font-semibold mb-8">Pays for itself in week 1</p>
              </div>

              {/* Features */}
              <div className="grid md:grid-cols-2 gap-4 mb-8">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start">
                    <Check className="w-5 h-5 text-green-400 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="text-center">
                <a href="/lifetime-deal" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-full font-bold text-xl transition-all hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-xl inline-block mb-4">
                  Get Lifetime Access - $47.99
                </a>
                <p className="text-sm text-gray-400">60-Day Money-Back Guarantee</p>
              </div>
            </div>
          </div>

          {/* Guarantee & Urgency */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6 text-center">
              <Shield className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2">60-Day Guarantee</h3>
              <p className="text-sm text-gray-300">If it doesn't save you 10+ hours in month 1, get every penny back.</p>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold mb-2 text-red-400">Limited Spots</h3>
              <p className="text-sm text-gray-300">Only 129 lifetime deals remaining. After that, it's $47/month forever.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
