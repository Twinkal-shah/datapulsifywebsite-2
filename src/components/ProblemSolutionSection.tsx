import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  FileSpreadsheet,
  BarChart3, 
  Filter,
  Database,
  Eye,
  Brain,
  FileImage,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import LottieBackground from './LottieBackground';

const ProblemSolutionSection = () => {
  return (
    <section className="py-12 md:py-20 bg-black relative overflow-hidden">
      {/* Lottie Background Animation */}
      <LottieBackground className="z-0" />
      
      <div className="container-section relative z-10">
        <h2 className="section-title">The SEO Data Problem</h2>
        
        {/* Problem Description */}
        <div className="max-w-4xl mx-auto text-center mb-12">
          <div className="bg-red-900/20 border border-red-500/30 rounded-2xl p-8 mb-8">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <p className="text-lg md:text-xl text-gray-300 mb-6 leading-relaxed">
              Every Monday: Export GSC data. Clean messy spreadsheets. Create charts in Looker studio. Explain data gaps to clients. Repeat.
            </p>
            <div className="grid sm:grid-cols-3 gap-4 text-center mt-6">
              <div>
                <Clock className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">3+ hours wasted</div>
              </div>
              <div>
                <FileSpreadsheet className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Manual data cleaning</div>
              </div>
              <div>
                <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
                <div className="text-sm text-gray-400">Missed opportunities</div>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Showcase */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Sheets Platform Card */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-green-500/30 hover:border-green-500/50 transition-all duration-300 h-full flex flex-col">
            <div className="text-center lg:text-left mb-6">
              <div className="inline-flex items-center mb-4 p-4 bg-green-600/20 rounded-full border border-green-500/30">
                <FileSpreadsheet className="w-10 h-10 text-green-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Google Sheets Add-on</h3>
              <p className="text-green-400 font-medium">For SEO Analysts & Data Lovers</p>
            </div>
            
            <div className="space-y-5 flex-grow">
              <div className="flex items-start space-x-4">
                <div className="bg-green-600/20 rounded-lg p-2 mt-0.5">
                  <Filter className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Smart Query Builder</div>
                  <div className="text-sm text-gray-400 leading-relaxed">Filter data exactly how you think about it</div>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-green-600/20 rounded-lg p-2 mt-0.5">
                  <Database className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">No Sampling Limits</div>
                  <div className="text-sm text-gray-400 leading-relaxed">Get all your data, formatted perfectly</div>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="bg-green-600/20 rounded-lg p-2 mt-0.5">
                  <TrendingUp className="w-5 h-5 text-green-400 flex-shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Advanced Analytics</div>
                  <div className="text-sm text-gray-400 leading-relaxed">Click gap analysis, rank tracking, custom queries</div>
                </div>
              </div>
            </div>
          </div>

          {/* Dashboard Platform Card */}
          <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-purple-500/30 hover:border-purple-500/50 transition-all duration-300 h-full flex flex-col">
            <div className="text-center lg:text-left mb-6">
              <div className="inline-flex items-center mb-4 p-4 bg-purple-600/20 rounded-full border border-purple-500/30">
                <BarChart3 className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Visual Dashboard</h3>
              <p className="text-purple-400 font-medium">For Client Presentations & Insights</p>
            </div>
            
            <div className="space-y-5 flex-grow">
              <div className="flex items-start space-x-4">
                <div className="bg-purple-600/20 rounded-lg p-2 mt-0.5">
                  <Eye className="w-5 h-5 text-purple-400 flex-shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1">Interactive Visualizations</div>
                  <div className="text-sm text-gray-400 leading-relaxed">See opportunities jump off the screen</div>
                </div>
              </div>
              <div className="flex items-start space-x-4 opacity-60">
                <div className="bg-purple-600/20 rounded-lg p-2 mt-0.5">
                  <Brain className="w-5 h-5 text-purple-400 flex-shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1 flex items-center gap-2">
                    AI-Powered Insights 
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed">Automatic recommendations and opportunity detection</div>
                </div>
              </div>
              <div className="flex items-start space-x-4 opacity-60">
                <div className="bg-purple-600/20 rounded-lg p-2 mt-0.5">
                  <FileImage className="w-5 h-5 text-purple-400 flex-shrink-0" />
                </div>
                <div>
                  <div className="font-semibold text-white mb-1 flex items-center gap-2">
                    White-Label Reports 
                    <span className="text-xs bg-orange-500/20 text-orange-400 px-2 py-1 rounded-full">Coming Soon</span>
                  </div>
                  <div className="text-sm text-gray-400 leading-relaxed">Beautiful, branded reports that win clients</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cross-Platform Magic */}
        <div className="text-center">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-500/30 max-w-4xl mx-auto">
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

export default ProblemSolutionSection;