
import React from 'react';
import { ArrowRight, Star, Shield, Users, Zap } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import LottieBackground from './LottieBackground';

const HeroSection = () => {
  const isMobile = useIsMobile();
  
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden gradient-bg">
      {/* Lottie Background Animation */}
      <LottieBackground className="z-0" />
      
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden z-10">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-radial from-gray-800/20 to-transparent"></div>
        
        {/* Abstract wave patterns */}
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-gray-800/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container-section relative z-20">
        <div className="max-w-4xl mx-auto text-center">
          {/* Hero Badge */}
          <div className="inline-flex items-center py-2 px-4 rounded-full text-sm bg-white/10 text-white mb-6 backdrop-blur-sm animate-fade-in border border-white/20">
            <Zap className="w-4 h-4 mr-2 text-yellow-400" />
            <span className="font-medium">Google Sheets + Dashboard • Built by SEOs for SEOs</span>
          </div>
          
          {/* Main Headline */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold leading-tight mb-6 animate-fade-in animate-delay-75">
            Turn Google Search Console Data Into
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent"> Actionable Insights</span>
          </h1>
          
          {/* Sub-headline */}
          <h2 className="text-xl md:text-2xl lg:text-3xl text-gray-300 mb-6 animate-fade-in animate-delay-150 font-medium">
            Stop wrestling with GSC exports. Get clean data, beautiful reports, and find opportunities in minutes.
          </h2>
          
          {/* Key Benefits */}
          <div className="grid sm:grid-cols-3 gap-6 mb-8 max-w-3xl mx-auto animate-fade-in animate-delay-300">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">25K</div>
              <div className="text-sm text-gray-400">Row Capacity</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">2 Platforms</div>
              <div className="text-sm text-gray-400">Sheets + Dashboard</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">5 Min</div>
              <div className="text-sm text-gray-400">Setup Time</div>
            </div>
          </div>
          
          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8 animate-fade-in animate-delay-500">
            <a href="/lifetime-deal" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 px-8 rounded-full font-bold text-lg transition-all hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-xl">
              Get Lifetime Access - $47.99
            </a>
            <a href="#features" className="border-2 border-white text-white py-4 px-8 rounded-full font-medium text-lg transition-all hover:bg-white/10 flex items-center justify-center">
              See How It Works
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-400 animate-fade-in animate-delay-700">
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2 text-green-400" />
              <span>60-day money-back guarantee</span>
            </div>
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-2 text-yellow-400" />
              <span>4.9/5 rating from 200+ SEOs</span>
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-2 text-blue-400" />
              <span>Limited lifetime spots</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;