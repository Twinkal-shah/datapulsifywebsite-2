
import React from 'react';
import { 
  FileSpreadsheet, 
  BarChart3, 
  Zap, 
  Filter,
  Database,
  Eye,
  Brain,
  FileImage,
  RefreshCw,
  Target,
  TrendingUp,
  Clock
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
    <section id="features" className="gradient-bg py-20 md:py-32">
      <div className="container-section">
        <h2 className="section-title">Everything You Need to Master GSC Data</h2>
        <p className="section-subtitle">
          Two platforms, endless possibilities. Use sheets for deep analysis, dashboard for client presentations.
        </p>

        {/* Core Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-16 mb-16">
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

        {/* Platform Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 mt-16">
          {/* Sheets Platform */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-4 p-3 bg-green-600/20 rounded-full border border-green-500/30">
                <FileSpreadsheet className="w-8 h-8 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Google Sheets Add-on</h3>
              <p className="text-green-400 font-medium">For SEO Analysts & Data Lovers</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Filter className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">Smart Query Builder</div>
                  <div className="text-sm text-gray-400">Filter data exactly how you think about it</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <Database className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">No Sampling Limits</div>
                  <div className="text-sm text-gray-400">Get all your data, formatted perfectly</div>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <TrendingUp className="w-5 h-5 text-green-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">Advanced Analytics</div>
                  <div className="text-sm text-gray-400">Click gap analysis, rank tracking, custom queries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Platform */}
          <div className="space-y-6">
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center mb-4 p-3 bg-purple-600/20 rounded-full border border-purple-500/30">
                <BarChart3 className="w-8 h-8 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Visual Dashboard</h3>
              <p className="text-purple-400 font-medium">For Client Presentations & Insights</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <Eye className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">Interactive Visualizations</div>
                  <div className="text-sm text-gray-400">See opportunities jump off the screen</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 opacity-60">
                <Brain className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">AI-Powered Insights <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Coming Soon</span></div>
                  <div className="text-sm text-gray-400">Automatic recommendations and opportunity detection</div>
                </div>
              </div>
              <div className="flex items-start space-x-3 opacity-60">
                <FileImage className="w-5 h-5 text-purple-400 mt-1 flex-shrink-0" />
                <div>
                  <div className="font-medium">White-Label Reports <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Coming Soon</span></div>
                  <div className="text-sm text-gray-400">Beautiful, branded reports that win clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Platform Magic */}
        <div className="mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-500/30 max-w-3xl mx-auto">
            <RefreshCw className="w-12 h-12 text-blue-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">Perfect Together</h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Start your analysis in sheets, create stunning presentations in the dashboard. Data syncs instantly between both platforms.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;