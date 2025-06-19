
import React from 'react';
import { Check, BarChart2, Database, RefreshCw } from 'lucide-react';

const steps = [
  {
    title: "Connect Your GSC Account",
    description: "One-click integration with Google Search Console",
    icon: Check
  },
  {
    title: "Choose Data & Customize Queries",
    description: "Select exactly what data you want to analyze",
    icon: Database
  },
  {
    title: "Sync to Google Sheets & Dashboard",
    description: "Seamlessly pull data into your spreadsheets",
    icon: RefreshCw
  },
  {
    title: "Analyze & Share Insights",
    description: "Transform data into actionable insights",
    icon: BarChart2
  }
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="bg-black pt-4 pb-14 md:pb-20 lg:pb-28">
      <div className="container-section">
        <h2 className="section-title">How It Works</h2>
        <p className="section-subtitle">
          Getting started with Datapulsify is easy. Here's how you can begin analyzing your GSC data in minutes.
        </p>

        <div className="mt-10 md:mt-16 relative">
          {/* Timeline connector - only visible on larger screens */}
          <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-gray-800"></div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            {steps.map((step, index) => (
              <div 
                key={step.title} 
                className="relative flex flex-col items-center text-center opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                {/* Step number with icon */}
                <div className="mb-4 md:mb-6 relative z-10">
                  <div className="flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-full bg-gray-900 border border-gray-700 text-white mb-3 md:mb-4 shadow-lg">
                    <step.icon size={24} />
                  </div>
                  <div className="absolute -bottom-2 -right-2 w-5 h-5 md:w-6 md:h-6 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs md:text-sm">
                    {index + 1}
                  </div>
                </div>
                
                <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-2">{step.title}</h3>
                <p className="text-xs md:text-sm text-gray-400">{step.description}</p>
              </div>
            ))}
          </div>
          
          {/* Illustration below the steps */}
          
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
