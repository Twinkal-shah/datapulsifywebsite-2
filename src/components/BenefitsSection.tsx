
import React from 'react';
import { Clock, DollarSign, TrendingUp, Users, Zap, Target } from 'lucide-react';

const BenefitsSection = () => {
  const benefits = [
    { number: "15+", label: "Hours saved per month", subtitle: "on data collection and formatting" },
    { number: "5", label: "Minutes to create presentations", subtitle: "instead of 2 hours" },
    { number: "3-5", label: "Quick wins per client", subtitle: "with visual gap analysis" },
    { number: "40%", label: "Average client retention increase", subtitle: "with stunning, automated reporting" },
  ];

  return (
    <section className="py-20 md:py-32 bg-black">
      <div className="container-section">
        <h2 className="section-title">Why This Dual-Platform Approach Changes Everything</h2>
        
        <div className="max-w-4xl mx-auto text-center mb-16">
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-2xl p-8">
            <h3 className="text-2xl md:text-3xl font-bold mb-6">Here's what I learned in 8 years of SEO:</h3>
            <p className="text-lg md:text-xl text-gray-300 mb-8 leading-relaxed">
              Some days you need to <strong>crunch numbers in spreadsheets</strong> (hello, pivot tables and VLOOKUP). Other days you need to <strong>present insights that make executives go "wow"</strong> (hello, beautiful dashboards).
            </p>
            <p className="text-xl font-bold text-white mb-4">Most tools force you to choose. DataPulsify gives you both.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-16 max-w-5xl mx-auto">
          {/* Spreadsheet Days */}
          <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <Clock className="w-8 h-8 text-green-400 mr-3" />
              <h3 className="text-xl font-bold">The Spreadsheet Days:</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <Target className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Deep data analysis and manipulation</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Custom formulas and advanced filtering</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Familiar environment for complex calculations</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Easy sharing with team members who live in Excel</span>
              </li>
            </ul>
          </div>

          {/* Dashboard Days */}
          <div className="bg-purple-900/20 border border-purple-500/30 rounded-xl p-8">
            <div className="flex items-center mb-6">
              <TrendingUp className="w-8 h-8 text-purple-400 mr-3" />
              <h3 className="text-xl font-bold">The Dashboard Days:</h3>
            </div>
            <ul className="space-y-3 text-gray-300">
              <li className="flex items-start">
                <Target className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Client presentations that close deals</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Quick visual insights for strategy meetings</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>Beautiful charts for social media and reports</span>
              </li>
              <li className="flex items-start">
                <Target className="w-5 h-5 text-purple-400 mr-2 mt-0.5 flex-shrink-0" />
                <span>AI-powered recommendations that impress stakeholders</span>
              </li>
            </ul>
          </div>
        </div>

        {/* The Magic */}
        <div className="text-center mb-16">
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-2xl p-8 border border-blue-500/30 max-w-4xl mx-auto">
            <Zap className="w-12 h-12 text-yellow-400 mx-auto mb-4" />
            <h3 className="text-2xl font-bold mb-4">The Magic:</h3>
            <p className="text-lg text-gray-300 leading-relaxed">
              Both platforms sync seamlessly. Changes in your dashboard reflect instantly in sheets. Export dashboard visualizations to your spreadsheets. Import sheet insights to power dashboard recommendations.
            </p>
          </div>
        </div>

        {/* ROI Numbers */}
        <div className="max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-12">The Numbers That Actually Matter:</h3>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-800/50 to-gray-900/50 rounded-xl p-6 text-center border border-gray-700 hover:border-gray-600 transition-all">
                <div className="text-3xl md:text-4xl font-bold text-blue-400 mb-2">{benefit.number}</div>
                <div className="text-lg font-semibold mb-1">{benefit.label}</div>
                <div className="text-sm text-gray-400">{benefit.subtitle}</div>
              </div>
            ))}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6 mt-8">
            <div className="bg-gradient-to-br from-green-900/30 to-green-800/30 rounded-xl p-6 text-center border border-green-600/30">
              <DollarSign className="w-10 h-10 text-green-400 mx-auto mb-3" />
              <div className="text-lg font-semibold mb-2">Scale without hiring</div>
              <div className="text-sm text-gray-300">more junior analysts for data work</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-900/30 to-purple-800/30 rounded-xl p-6 text-center border border-purple-600/30">
              <Users className="w-10 h-10 text-purple-400 mx-auto mb-3" />
              <div className="text-lg font-semibold mb-2">Impress stakeholders</div>
              <div className="text-sm text-gray-300">with insights that drive real decisions</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;