
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Check, Star } from 'lucide-react';
import { Link } from 'react-router-dom';

const LifetimeDeal = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="gradient-bg py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-pattern bg-no-repeat bg-cover opacity-10"></div>
          <div className="container-section relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <Badge variant="outline" className="mb-4 py-1.5 px-4 text-white border-white/30 bg-white/5 rounded-full">
                Limited Time Offer
              </Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6 animate-fade-in">
                Datapulsify <span className="text-white/80">Lifetime Deal</span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-300 mb-8 animate-fade-in animate-delay-150">
                One-time payment. Lifetime access. No more subscriptions.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto animate-fade-in animate-delay-300">
                <a href="#pricing" className="btn-primary text-center w-full sm:w-auto">
                  Get Lifetime Access
                </a>
                <a href="#features" className="btn-secondary text-center w-full sm:w-auto">
                  View Features
                </a>
              </div>
            </div>
          </div>
        </section>
        
        {/* Deal Details Section */}
        <section id="pricing" className="bg-black py-20">
          <div className="container-section">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div className="order-2 md:order-1">
                <h2 className="text-2xl md:text-3xl font-bold mb-6">
                  One-Time Payment,<br />Lifetime Value
                </h2>
                <p className="text-gray-300 mb-6">
                  Stop paying for monthly subscriptions. Get Datapulsify with a one-time payment and enjoy all the benefits forever.
                </p>
                
                <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 mb-8">
                  <div className="flex items-start gap-2 mb-4">
                    <Star className="text-yellow-500 mt-1" size={20} />
                    <div>
                      <h3 className="font-semibold text-lg">Lifetime Deal Highlights</h3>
                      <p className="text-gray-400 text-sm">What makes this offer special</p>
                    </div>
                  </div>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <Check size={18} className="text-green-500" />
                      <span>One-time payment of <span className="font-bold text-white">$198</span></span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={18} className="text-green-500" />
                      <span>75,000 rows limit</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={18} className="text-green-500" />
                      <span>All Pro features included</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={18} className="text-green-500" />
                      <span>Future updates included</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <Check size={18} className="text-green-500" />
                      <span>No recurring payments</span>
                    </li>
                  </ul>
                </div>
                
                <a href="#" className="btn-primary w-full text-center py-4 text-lg font-medium">
                  Get Lifetime Access for $198
                </a>
                <p className="text-center text-gray-400 text-sm mt-3">Limited time offer • Secure payment</p>
              </div>
              
              <div className="order-1 md:order-2">
                <div className="border border-white backdrop-blur-md rounded-2xl overflow-hidden shadow-xl shadow-white/5 p-6 relative">
                  <div className="absolute top-0 right-0 bg-white text-black py-1 px-3 text-xs font-semibold rounded-bl-lg">
                    BEST VALUE
                  </div>
                  
                  <h3 className="text-xl font-bold mb-2">Lifetime Deal</h3>
                  <p className="text-gray-400 text-sm mb-4">One-time payment</p>
                  
                  <div className="flex items-baseline mb-1">
                    <span className="text-3xl md:text-4xl font-bold">$198</span>
                    <span className="text-gray-400 ml-2 line-through">$297</span>
                  </div>
                  <p className="text-green-500 text-sm mb-6">Save 33% with this limited offer</p>
                  
                  <div className="bg-white/5 p-4 rounded-lg mb-6">
                    <h4 className="font-medium mb-2">What's included:</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>75,000 rows limit</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>All core GSC data</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>Custom query builder</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>Priority support</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>All future updates</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>Automated refresh & scheduling</span>
                      </li>
                      <li className="flex items-start">
                        <Check size={16} className="mr-2 mt-0.5 text-green-500 flex-shrink-0" />
                        <span>Data visualizations</span>
                      </li>
                    </ul>
                  </div>
                  
                  <a href="#" className="btn-primary w-full text-center mb-3">Get Lifetime Access</a>
                  <p className="text-center text-xs text-gray-400">60-day money-back guarantee</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="gradient-bg py-16 md:py-20">
          <div className="container-section">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Common questions about our lifetime deal
            </p>
            
            <div className="max-w-3xl mx-auto mt-8 space-y-6">
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">What is a lifetime deal?</h3>
                <p className="text-gray-300">
                  A lifetime deal means you pay once and get access to Datapulsify forever. No recurring payments or subscriptions.
                </p>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">What happens if I need more than 75,000 rows?</h3>
                <p className="text-gray-300">
                  The lifetime deal includes a 75,000 row limit. If you need more, you can upgrade to our enterprise plan which offers custom row limits.
                </p>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">Will I get future updates?</h3>
                <p className="text-gray-300">
                  Yes! Your lifetime deal includes all future updates to the platform. You'll always have access to the latest features.
                </p>
              </div>
              
              <div className="bg-gray-900/50 border border-gray-800 p-5 rounded-xl">
                <h3 className="text-lg font-semibold mb-2">How long will this offer be available?</h3>
                <p className="text-gray-300">
                  This is a limited-time offer. Once we reach our limit of lifetime deal users, we'll close this offer permanently.
                </p>
              </div>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="bg-black py-16">
          <div className="container-section">
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-gray-800 rounded-2xl p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to get lifetime access?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join the hundreds of marketers and SEO professionals who've already secured their lifetime access to Datapulsify.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a href="#pricing" className="btn-primary">
                  Get Lifetime Access
                </a>
                <Link to="/" className="btn-secondary">
                  Learn More
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default LifetimeDeal;
