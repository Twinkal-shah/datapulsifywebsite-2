
import React from 'react';
import { ArrowRight, Clock, DollarSign, AlertTriangle, CheckCircle, Zap } from 'lucide-react';

const FinalCtaSection = () => {
  const steps = [
    { step: 1, action: "Get instant access", description: "Both platforms ready in 5 minutes" },
    { step: 2, action: "Connect GSC", description: "One-click authorization" },
    { step: 3, action: "Find first opportunity", description: "Usually within 10 minutes" },
    { step: 4, action: "Impress stakeholders", description: "Beautiful reports, instant credibility" }
  ];

  return (
    <section className="py-12 md:py-20 bg-black">
      <div className="container-section">
        <h2 className="section-title">Ready to Transform Your SEO Workflow?</h2>
        
        <div className="max-w-4xl mx-auto">
          {/* The Choice */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-red-400">Keep Struggling:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Waste 3+ hours every Monday on data prep</li>
                <li>• Miss opportunities hidden in messy exports</li>
                <li>• Create charts in PowerPoint like it's 2010</li>
                <li>• Explain data gaps to frustrated clients</li>
              </ul>
            </div>
            
            <div className="bg-green-900/20 border border-green-500/30 rounded-xl p-6">
              <h3 className="text-xl font-bold mb-4 text-green-400">Get DataPulsify:</h3>
              <ul className="text-gray-300 space-y-2 text-sm">
                <li>• Clean GSC data in seconds, not hours</li>
                <li>• Smart analysis finds opportunities you'd miss</li>
                <li>• Impress clients with beautiful reports</li>
                <li>• Save 15+ hours per month, guaranteed</li>
              </ul>
            </div>
          </div>

          {/* Value Proposition */}
          <div className="bg-blue-900/20 border border-blue-500/30 rounded-xl p-8 mb-12 text-center">
            <h3 className="text-2xl font-bold mb-6">The Math is Simple</h3>
            <div className="grid sm:grid-cols-4 gap-6 text-center">
              <div>
                <Clock className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">15+ hours</div>
                <div className="text-sm text-gray-400">saved monthly</div>
              </div>
              <div>
                <DollarSign className="w-8 h-8 text-green-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">$100/hour</div>
                <div className="text-sm text-gray-400">your time value</div>
              </div>
              <div>
                <CheckCircle className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">$1,500+</div>
                <div className="text-sm text-gray-400">monthly value</div>
              </div>
              <div>
                <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
                <div className="text-2xl font-bold">Week 1</div>
                <div className="text-sm text-gray-400">payback time</div>
              </div>
            </div>
            <p className="text-lg text-gray-300 mt-6">DataPulsify: <span className="font-bold">$49.99 once</span> • Pays for itself in week 1</p>
          </div>

          {/* Main CTA */}
          <div className="text-center mb-12">
            <a href="/lifetimeDeal" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-6 px-12 rounded-full font-bold text-2xl transition-all hover:from-blue-700 hover:to-purple-700 hover:scale-105 shadow-xl inline-block mb-4">
              Get Lifetime Access
            </a>
            <p className="text-gray-400">Both platforms • 60-day guarantee • Limited spots remaining</p>
          </div>

          {/* What Happens Next */}
          <div className="mb-12">
            <h3 className="text-xl font-bold text-center mb-8">What Happens Next</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((item, index) => (
                <div key={index} className="bg-gray-800/30 rounded-lg p-6 text-center border border-gray-700">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold mx-auto mb-4">
                    {item.step}
                  </div>
                  <h4 className="font-semibold mb-2">{item.action}</h4>
                  <p className="text-sm text-gray-400">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Urgency */}
          <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-4 text-red-400">
              ⚠️ Only 129 lifetime spots remaining
            </h3>
            <p className="text-lg text-gray-300 mb-4">
              After that, it's $9.99/month with no grandfathering. Don't miss this one-time opportunity.
            </p>
            <a href="/lifetimeDeal" className="btn-primary inline-flex items-center">
              Secure Your Spot Now
              <ArrowRight className="w-5 h-5 ml-2" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCtaSection;