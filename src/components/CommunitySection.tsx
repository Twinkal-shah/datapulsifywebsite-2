
import React from 'react';
import { Users, MessageSquare, Github, Heart } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const CommunitySection = () => {
  return (
    <section id="community" className="gradient-bg py-14 md:py-20 lg:py-24 p-0">
      <div className="container-section">
        <h2 className="section-title">Join Our Community</h2>
        <p className="section-subtitle">
          Connect with other data professionals, share insights, and get help from our growing community.
        </p>
        <a href="https://chat.whatsapp.com/Jw6j4yiBrIvK12gUIOl5Q0" className="btn-primary mx-auto w-fit px-6 py-3 text-center block">Join our thriving community</a>
        
        

        {/* Testimonials / Community Stats */}
        {/* <div className="border border-white/10 bg-black/50 backdrop-blur-sm rounded-2xl p-5 md:p-8 mt-8 md:mt-12 opacity-0 animate-fade-in animate-delay-500">
          <div className="text-center mb-6 md:mb-8">
            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4">Our Growing Community</h3>
            <p className="text-sm md:text-base text-gray-300 max-w-2xl mx-auto">
              Join thousands of data professionals who trust Datapulsify for their GSC data needs.
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 text-center">
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-1">500+</p>
              <p className="text-xs md:text-sm text-gray-400">Active Users</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-1">50k+</p>
              <p className="text-xs md:text-sm text-gray-400">Queries Run</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-1">30+</p>
              <p className="text-xs md:text-sm text-gray-400">Countries</p>
            </div>
            <div>
              <p className="text-2xl md:text-3xl font-bold mb-1">4.9/5</p>
              <p className="text-xs md:text-sm text-gray-400">User Rating</p>
            </div>
          </div>
        </div> */}
      </div>
    </section>
  );
};

export default CommunitySection;
