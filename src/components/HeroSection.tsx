
import React from 'react';
import { ArrowRight, ChevronRight } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

const HeroSection = () => {
  const isMobile = useIsMobile();
  
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden gradient-bg">
      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-radial from-gray-800/20 to-transparent"></div>
        
        {/* Abstract wave patterns */}
        <div className="absolute top-1/3 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 right-0 w-64 h-64 bg-gray-800/30 rounded-full blur-3xl"></div>
      </div>

      <div className="container-section relative z-10">
        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
          <div className="flex flex-col max-w-xl mx-auto md:mx-0 text-center md:text-left">
            <span className="inline-block py-1 px-3 rounded-full text-xs md:text-sm bg-white/10 text-white mb-4 md:mb-6 backdrop-blur-sm animate-fade-in">
              The easiest way to analyze GSC data
            </span>
            
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 md:mb-6 animate-fade-in animate-delay-75">
              Effortless GSC Data Sync for Google Sheets
            </h1>
            
            <p className="text-base md:text-lg text-gray-300 mb-6 md:mb-10 animate-fade-in animate-delay-150">
              Datapulsify lets you seamlessly pull, analyze, and automate your 
              Google Search Console data inside Google Sheets.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start mb-6 animate-fade-in animate-delay-300">
              <a href="#pricing" className="btn-primary">
                Get Started for Free
              </a>
              <a href="#how-it-works" className="btn-secondary">
                See How It Works
              </a>
            </div>
            
            <div className="text-xs md:text-sm text-gray-400 animate-fade-in animate-delay-500">
              No credit card required. Cancel anytime.
            </div>
          </div>
          
          <div className="relative animate-fade-in-right animate-delay-300 mt-4 md:mt-0">
            <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 animate-float">
              {/* Mockup Header */}
              <div className="absolute top-0 left-0 right-0 h-6 md:h-8 bg-gray-800 flex items-center px-2 md:px-3">
                <div className="flex gap-1 md:gap-1.5">
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-600 rounded-full"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-600 rounded-full"></div>
                  <div className="w-2 h-2 md:w-3 md:h-3 bg-gray-600 rounded-full"></div>
                </div>
                <div className="absolute inset-x-0 top-0 h-full flex items-center justify-center">
                  <div className="px-2 md:px-4 bg-gray-700 rounded-md text-[10px] md:text-xs text-gray-300">
                    Datapulsify GSC Integration
                  </div>
                </div>
              </div>
              
              {/* Mockup Content */}
              <div className="pt-6 md:pt-8 p-2 md:p-4 h-full flex flex-col">
                <div className="grid grid-cols-6 gap-1 mb-2">
                  <div className="col-span-1 bg-gray-700 h-4 md:h-6 rounded"></div>
                  <div className="col-span-1 bg-gray-700 h-4 md:h-6 rounded"></div>
                  <div className="col-span-1 bg-gray-700 h-4 md:h-6 rounded"></div>
                  <div className="col-span-1 bg-gray-700 h-4 md:h-6 rounded"></div>
                  <div className="col-span-1 bg-gray-700 h-4 md:h-6 rounded"></div>
                  <div className="col-span-1 bg-gray-700 h-4 md:h-6 rounded"></div>
                </div>
                
                <div className="flex-1 grid grid-cols-6 gap-1">
                  {/* Data rows */}
                  {Array.from({ length: isMobile ? 6 : 10 }).map((_, rowIndex) => (
                    <React.Fragment key={`row-${rowIndex}`}>
                      <div className="col-span-3 bg-gray-700/70 h-5 md:h-8 rounded"></div>
                      <div className="col-span-1 bg-gray-700/70 h-5 md:h-8 rounded"></div>
                      <div className="col-span-1 bg-gray-700/70 h-5 md:h-8 rounded"></div>
                      <div className="col-span-1 bg-gray-700/70 h-5 md:h-8 rounded"></div>
                    </React.Fragment>
                  ))}
                </div>
                
                <div className="absolute bottom-2 md:bottom-4 right-2 md:right-4 px-2 md:px-3 py-1 md:py-1.5 bg-white text-black rounded-lg text-[10px] md:text-xs font-medium shadow-lg flex items-center gap-1">
                  <span>Synced with GSC</span>
                  <ChevronRight size={isMobile ? 10 : 14} />
                </div>
              </div>
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -bottom-6 -right-6 w-16 md:w-24 h-16 md:h-24 bg-white/5 rounded-full blur-xl"></div>
            <div className="absolute -top-6 -left-6 w-20 md:w-32 h-20 md:h-32 bg-white/5 rounded-full blur-xl"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
