
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MessageSquare, ArrowRight, Sparkles, Star, Users, CheckCircle } from 'lucide-react';

const Waitlist = () => {
  // WhatsApp group link with the provided URL
  const whatsAppLink = "https://chat.whatsapp.com/Jw6j4yiBrIvK12gUIOl5Q0"; 
  
  const handleJoinWaitlist = () => {
    window.open(whatsAppLink, '_blank');
  };

  return (
    <div className="min-h-screen flex flex-col w-full"> 
    <Navbar />     
      <main className="flex-grow">
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center pt-16 overflow-hidden gradient-bg">
          {/* Background Elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-radial from-gray-800/20 to-transparent"></div>
            
            {/* Abstract wave patterns */}
            <div className="absolute top-1/3 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
            <div className="absolute top-1/2 right-0 w-64 h-64 bg-gray-800/30 rounded-full blur-3xl"></div>
          </div>

          <div className="container-section relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-block py-1 px-3 rounded-full text-xs md:text-sm bg-white/10 text-white mb-4 md:mb-6 backdrop-blur-sm animate-fade-in">
                Limited Spots Available
              </span>
              
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold leading-tight mb-4 md:mb-6 animate-fade-in animate-delay-75">
                Join Our Exclusive Waitlist
              </h1>
              
              <p className="text-base md:text-lg text-gray-300 mb-6 md:mb-10 animate-fade-in animate-delay-150">
                Be the first to access Datapulsify's powerful GSC data sync tools and receive special early adopter benefits.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6 animate-fade-in animate-delay-300">
                <button 
                  onClick={handleJoinWaitlist} 
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  <MessageSquare size={18} />
                  Join Our WhatsApp Community
                  <ArrowRight size={18} />
                </button>
              </div>
              
              <div className="text-xs md:text-sm text-gray-400 animate-fade-in animate-delay-500">
                Connect instantly with our team and other data professionals
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="gradient-bg py-12 md:py-16">
          <div className="container-section">
            <h2 className="section-title">Waitlist Benefits</h2>
            <p className="section-subtitle">
              Join our waitlist today and enjoy these exclusive advantages
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 mt-8">
              {/* Benefit 1 */}
              <div className="feature-card opacity-0 animate-fade-in">
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-2 md:p-3 bg-black/50 rounded-lg w-fit">
                    <Star size={24} className="text-white" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Early Access</h3>
                  <p className="text-sm md:text-base text-gray-300">
                    Be among the first to use our powerful GSC data tools before they're available to the public.
                  </p>
                </div>
              </div>

              {/* Benefit 2 */}
              <div className="feature-card opacity-0 animate-fade-in animate-delay-150">
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-2 md:p-3 bg-black/50 rounded-lg w-fit">
                    <Sparkles size={24} className="text-white" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Founder's Pricing</h3>
                  <p className="text-sm md:text-base text-gray-300">
                    Lock in special lifetime discounts that won't be available after our public launch.
                  </p>
                </div>
              </div>

              {/* Benefit 3 */}
              <div className="feature-card opacity-0 animate-fade-in animate-delay-300">
                <div className="flex flex-col h-full">
                  <div className="mb-4 p-2 md:p-3 bg-black/50 rounded-lg w-fit">
                    <Users size={24} className="text-white" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">Community Access</h3>
                  <p className="text-sm md:text-base text-gray-300">
                    Join our exclusive WhatsApp community to connect with our team and other data professionals.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What to Expect Section */}
        <section className="bg-black py-12 md:py-16">
          <div className="container-section">
            <h2 className="section-title">What To Expect</h2>
            <p className="section-subtitle">
              Here's what happens when you join our waitlist
            </p>

            <div className="max-w-3xl mx-auto mt-8 md:mt-12">
              <div className="space-y-6">
                {/* Step 1 */}
                <div className="flex gap-4 opacity-0 animate-fade-in">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">1</div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Join Our WhatsApp Group</h3>
                    <p className="text-sm md:text-base text-gray-300">
                      Click the join button to enter our exclusive WhatsApp community where you'll receive updates and connect with the team.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="flex gap-4 opacity-0 animate-fade-in animate-delay-150">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">2</div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Receive Updates</h3>
                    <p className="text-sm md:text-base text-gray-300">
                      Get regular product updates, launch timelines, and exclusive content directly in the community group.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="flex gap-4 opacity-0 animate-fade-in animate-delay-300">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">3</div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Early Access Invitation</h3>
                    <p className="text-sm md:text-base text-gray-300">
                      When we're ready to launch, waitlist members will receive first access to the platform before the general public.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="flex gap-4 opacity-0 animate-fade-in animate-delay-500">
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center text-sm font-bold">4</div>
                  </div>
                  <div>
                    <h3 className="text-lg md:text-xl font-semibold mb-2">Special Benefits</h3>
                    <p className="text-sm md:text-base text-gray-300">
                      Unlock founder's pricing, exclusive features, and priority support as a thank you for joining our early community.
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={handleJoinWaitlist}
                  className="btn-primary flex items-center justify-center gap-2 mx-auto"
                >
                  <CheckCircle size={18} />
                  Join Waitlist Now
                </button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Waitlist;
