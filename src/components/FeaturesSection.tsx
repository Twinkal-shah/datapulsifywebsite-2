
import React from 'react';
import { 
  Link, 
  BarChart3, 
  RefreshCcw, 
  Database 
} from 'lucide-react';

const features = [
  {
    title: "One-Click GSC Integration",
    description: "Connect your Google Search Console in seconds and start pulling data instantly.",
    icon: Link,
    comingSoon: false
  },
  {
    title: "Custom Query Builder",
    description: "Filter, segment, and extract the exact data you need with easy-to-use query tools.",
    icon: Database,
    comingSoon: false
  },
  {
    title: "Automated Refresh & Scheduling",
    description: "Keep your reports always updated with automated sync options.",
    icon: RefreshCcw,
    comingSoon: true
  },
  {
    title: "Powerful Data Visualizations",
    description: "Turn raw GSC data into meaningful insights with built-in chart compatibility.",
    icon: BarChart3,
    comingSoon: true
  }
];

const FeaturesSection = () => {
  return (
    <section id="features" className="gradient-bg py-14 md:py-20 lg:py-28">
      <div className="container-section">
        <h2 className="section-title">Built for SEOs Who Crave Clean, Actionable Data</h2>
        <p className="section-subtitle">
        Leverage Raw Google Search Console Data Inside Spreadsheets where you live
        </p>

        <div className="grid sm:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
          {features.map((feature, index) => (
            <div 
              key={feature.title} 
              className="feature-card opacity-0 animate-fade-in"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              <div className="flex flex-col h-full">
                <div className="mb-4 md:mb-6 p-2 md:p-3 bg-black/50 rounded-lg w-fit">
                  <feature.icon size={24} className="text-white" />
                </div>
                
                <div className="flex items-center flex-wrap gap-2 mb-2 md:mb-3">
                  <h3 className="text-lg md:text-xl font-semibold">{feature.title}</h3>
                  {feature.comingSoon && (
                    <span className="text-xs py-0.5 px-2 bg-white/10 rounded-full text-gray-300">
                      Coming Soon
                    </span>
                  )}
                </div>
                
                <p className="text-sm md:text-base text-gray-300">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
