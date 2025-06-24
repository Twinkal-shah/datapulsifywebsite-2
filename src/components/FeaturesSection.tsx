import React from 'react';
import { 
  Zap, 
  Brain,
  FileImage,
  Database,
  CheckCircle,
  Target
} from 'lucide-react';

const FeaturesSection = () => {
  const coreFeatures = [
    {
      title: "One-Click GSC Import",
      description: "Connect Google Search Console in seconds. No API keys, no technical setup.",
      icon: Zap,
      benefit: "Save 2+ hours per week"
    },
    {
      title: "Smart Data Analysis", 
      description: "Find click gap opportunities, track rankings, identify quick wins automatically.",
      icon: Brain,
      benefit: "Spot opportunities others miss"
    },
    {
      title: "Client-Ready Reports",
      description: "Beautiful visualizations and professional reports that impress stakeholders.",
      icon: FileImage,
      benefit: "Win more business"
    },
    {
      title: "25K Row Capacity",
      description: "Handle large datasets without sampling limits or data restrictions.",
      icon: Database,
      benefit: "Perfect for small to medium sites"
    }
  ];

  return (
    <section id="features" className="gradient-bg py-12 md:py-20">
      <div className="container-section">
        <h2 className="section-title">One Powerful Solution</h2>
        <p className="section-subtitle">
        Getting started with Datapulsify is easy. Here's how you can begin analyzing your GSC data in minutes.

        </p>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12 mb-16">
          {coreFeatures.map((feature, index) => (
            <div key={index} className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all text-center">
              <div className="bg-blue-600/20 rounded-lg p-3 w-fit mx-auto mb-4">
                <feature.icon className="w-8 h-8 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-gray-300 text-sm mb-3 leading-relaxed">{feature.description}</p>
              <div className="text-xs text-green-400 font-medium">{feature.benefit}</div>
            </div>
          ))}
        </div>

        {/* Platform Workflow Section */}
        <div className="max-w-5xl mx-auto">
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 border border-blue-500/30 rounded-2xl p-8">
            <div className="text-center mb-8">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-xl md:text-2xl font-bold text-white mb-4">
                Two powerful platforms. One seamless workflow.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Zap className="w-8 h-8 text-blue-400 mr-3" />
                  <h4 className="text-xl font-bold">Google Sheets Add-on</h4>
                </div>
                <p className="text-gray-300 mb-4">Work where you already live – inside your familiar spreadsheets with powerful GSC integration.</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• One-click data import</li>
                  <li>• Smart filtering & queries</li>
                  <li>• No sampling limits</li>
                </ul>
              </div>
              
              <div className="bg-black/30 rounded-xl p-6 border border-gray-700">
                <div className="flex items-center mb-4">
                  <Target className="w-8 h-8 text-purple-400 mr-3" />
                  <h4 className="text-xl font-bold">Beautiful Dashboard</h4>
                </div>
                <p className="text-gray-300 mb-4">When you need to impress clients or dive deep into visual analysis and insights.</p>
                <ul className="text-sm text-gray-400 space-y-1">
                  <li>• Click gap analysis</li>
                  <li>• AI-powered insights</li>
                  <li>• Client-ready reports</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;