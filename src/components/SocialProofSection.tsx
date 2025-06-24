import React from 'react';
import { Star, Quote, TrendingUp, Users, Zap } from 'lucide-react';
import LottieBackground from './LottieBackground';

const SocialProofSection = () => {
  const testimonials = [
    {
      quote: "Cut my weekly reporting time from 3 hours to 15 minutes. The dashboard presentations have helped us increase retainer fees by 40%.",
      name: "Sarah M.",
      position: "SEO Manager at Growth Agency"
    },
    {
      quote: "Finally, someone who gets it. The click gap analysis alone has helped us find opportunities worth 50K+ monthly traffic.",
      name: "Mike R.",
      position: "In-House SEO at SaaS Company"
    },
    {
      quote: "Built by an SEO who actually understands our pain. Every feature exists because I needed it myself.",
      name: "Jessica L.",
      position: "Freelance SEO Consultant"
    }
  ];

  const stats = [
    { icon: Users, value: "200+", label: "SEO Professionals" },
    { icon: TrendingUp, value: "15hrs", label: "Saved Per Month" },
    { icon: Zap, value: "5min", label: "Setup Time" },
    { icon: Star, value: "4.9/5", label: "User Rating" }
  ];

  return (
    <section className="gradient-bg py-12 md:py-20 relative overflow-hidden">
      {/* Lottie Background Animation */}
      <LottieBackground className="z-0" />
      
      <div className="container-section relative z-10">
        <h2 className="section-title">Trusted by 82 SEO Professionals and marketing agencies</h2>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mb-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="bg-white/10 backdrop-blur-sm rounded-full p-4 w-fit mx-auto mb-3 border border-white/20">
                <stat.icon className="w-6 h-6 text-blue-400" />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-sm text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-black/40 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:border-white/20 transition-all">
              <Quote className="w-6 h-6 text-blue-400 mb-4" />
              
              <blockquote className="text-gray-300 mb-6 leading-relaxed">
                "{testimonial.quote}"
              </blockquote>
              
              <div className="border-t border-gray-700 pt-4">
                <div className="font-semibold text-white text-sm">{testimonial.name}</div>
                <div className="text-gray-400 text-xs">{testimonial.position}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Rating Badge */}
        <div className="text-center mt-12">
          <div className="inline-flex items-center bg-yellow-600/20 border border-yellow-500/30 rounded-full py-3 px-6">
            <div className="flex mr-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              ))}
            </div>
            <span className="font-semibold">4.9/5 from 200+ SEO professionals</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SocialProofSection;