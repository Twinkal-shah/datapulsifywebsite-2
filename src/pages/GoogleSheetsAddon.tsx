import React, { useEffect } from 'react';
import { 
  Target, 
  TrendingUp, 
  Zap, 
  MousePointer, 
  Database,
  ArrowRight,
  CheckCircle,
  Star,
  Download,
  Play
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LottieBackground from '@/components/LottieBackground';
import { VIDEO_URLS } from '@/config/videoConfig';

const GoogleSheetsAddon = () => {
  // Scroll animations effect
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
          }
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1,
      }
    );

    const hiddenElements = document.querySelectorAll('.opacity-0');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => {
      hiddenElements.forEach((el) => observer.unobserve(el));
    };
  }, []);

  const features = [
    {
      title: "Click Gap Analysis",
      description: "Identify keyword opportunities where you're ranking but not getting enough clicks. Discover untapped potential in your existing rankings.",
      icon: Target,
      color: "from-blue-500 to-cyan-500"
    },
    {
      title: "Rank Tracker",
      description: "Monitor keyword positions over time with customizable frequency. Track your SEO progress with automated position monitoring.",
      icon: TrendingUp,
      color: "from-green-500 to-emerald-500"
    },
    {
      title: "Quick-Win (Page Improvement)",
      description: "Find underperforming pages that can be improved for fast SEO gains. Get actionable insights for immediate optimization.",
      icon: Zap,
      color: "from-yellow-500 to-orange-500"
    },
    {
      title: "Quick-Win (CTR Improvement)",
      description: "Highlight opportunities to increase click-through rates using meta tweaks. Boost your organic traffic with targeted optimizations.",
      icon: MousePointer,
      color: "from-purple-500 to-pink-500"
    },
    {
      title: "Raw SEO Data",
      description: "Export and analyze raw keyword data categorized by type and intent for deep analysis. Get complete control over your SEO data.",
      icon: Database,
      color: "from-red-500 to-rose-500"
    }
  ];

  const benefits = [
    "Seamless Google Sheets integration",
    "Real-time data synchronization", 
    "No technical setup required",
    "Automated reporting workflows",
    "Custom data filtering options",
    "Export-ready formats"
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "SEO Manager",
      company: "TechCorp",
      quote: "This add-on has revolutionized how we handle SEO data. The click gap analysis alone has helped us increase organic traffic by 40%.",
      rating: 5
    },
    {
      name: "Mike Rodriguez", 
      role: "Digital Marketing Director",
      company: "GrowthLab",
      quote: "The rank tracking feature saves us hours every week. Having all our SEO data directly in Google Sheets is a game-changer.",
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center pt-16 pb-4 overflow-hidden gradient-bg">
        {/* Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-radial from-gray-800/20 to-transparent"></div>
          <div className="absolute top-1/3 -left-20 w-72 h-72 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 right-0 w-64 h-64 bg-gray-800/30 rounded-full blur-3xl"></div>
          
          {/* Lottie Background Animation - Positioned behind content */}
          <div className="absolute inset-0" style={{ zIndex: 2 }}>
            <LottieBackground />
          </div>
        </div>

        <div className="container-section relative" style={{ zIndex: 10 }}>
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto hero-content">
            {/* Badge */}
            <div className="inline-block py-1 px-3 rounded-full text-xs md:text-sm bg-white/10 text-white mb-3 md:mb-4 backdrop-blur-sm animate-fade-in">
              🚀 Google Sheets Add-On
            </div>

            {/* Main Heading */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-3 md:mb-4 animate-fade-in animate-delay-75">
              Supercharge Your SEO Analysis in Google Sheets
            </h1>

            {/* Subheading */}
            <p className="text-base md:text-lg text-gray-300 mb-4 md:mb-6 max-w-2xl animate-fade-in animate-delay-150">
              Transform your Google Search Console data into actionable insights with our powerful add-on. Get click gap analysis, rank tracking, and quick-win opportunities directly in your spreadsheets.
            </p>

            {/* Visual Media - Reduced bottom margin */}
            <div className="relative hero-visual mb-4 md:mb-6 animate-fade-in animate-delay-300">
              <div className="relative w-full aspect-[4/3] bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl shadow-2xl overflow-hidden border border-gray-700 animate-float">
                <img
                  src={VIDEO_URLS.dashboardHero}
                  alt="Google Sheets Add-on Demo"
                  className="w-full h-full object-cover"
                  loading="eager"
                  onError={(e) => {
                    console.error('Image failed to load:', e);
                    // Fallback to local path
                    e.currentTarget.src = '/videos/dashboard-hero-section.gif';
                  }}
                />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-6 -right-6 w-16 md:w-24 h-16 md:h-24 bg-white/5 rounded-full blur-xl"></div>
              <div className="absolute -top-6 -left-6 w-20 md:w-32 h-20 md:h-32 bg-white/5 rounded-full blur-xl"></div>
            </div>

            {/* Call-to-Actions - Reduced top margin */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-2 animate-fade-in animate-delay-500">
              <a href="#install" className="btn-primary flex items-center gap-2">
                <Download size={18} />
                Try the Add-On
              </a>
              <a href="#demo" className="btn-secondary flex items-center gap-2">
                <Play size={18} />
                See it in Action
              </a>
            </div>

            {/* Additional Info */}
            <div className="text-xs md:text-sm text-gray-400 animate-fade-in animate-delay-500">
              Free to install. Works with any Google Sheets account.
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Reduced top padding for better section transition */}
      <section id="features" className="gradient-bg py-8 md:py-12 lg:py-16">
        <div className="container-section">
          <h2 className="section-title">Powerful SEO Features at Your Fingertips</h2>
          <p className="section-subtitle">
            Everything you need to analyze, track, and optimize your SEO performance directly in Google Sheets
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-8 md:mt-12">
            {features.map((feature, index) => (
              <div 
                key={feature.title} 
                className="feature-card opacity-0 animate-fade-in group hover:scale-105 transition-transform duration-300"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex flex-col h-full">
                  <div className={`mb-4 md:mb-6 p-3 bg-gradient-to-r ${feature.color} rounded-lg w-fit group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon size={24} className="text-white" />
                  </div>
                  
                  <h3 className="text-lg md:text-xl font-semibold mb-2 md:mb-3">{feature.title}</h3>
                  <p className="text-sm md:text-base text-gray-300 flex-grow">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-14 md:py-20 lg:py-28 bg-gray-900">
        <div className="container-section">
          <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
            <div>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
                Why Choose Our Google Sheets Add-On?
              </h2>
              <p className="text-base md:text-lg text-gray-300 mb-6 md:mb-8">
                Streamline your SEO workflow with seamless integration and powerful automation features.
              </p>
              
              <div className="grid gap-3 md:gap-4">
                {benefits.map((benefit, index) => (
                  <div 
                    key={benefit}
                    className="flex items-center gap-3 opacity-0 animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <CheckCircle size={20} className="text-green-500 flex-shrink-0" />
                    <span className="text-gray-300">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl p-6 md:p-8 border border-gray-700">
                <h3 className="text-xl font-semibold mb-4">Quick Setup Process</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">1</div>
                    <div>
                      <p className="font-medium">Install the Add-On</p>
                      <p className="text-sm text-gray-400">Get it from Google Workspace Marketplace</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">2</div>
                    <div>
                      <p className="font-medium">Connect Your GSC</p>
                      <p className="text-sm text-gray-400">Authorize your Google Search Console account</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs font-bold">3</div>
                    <div>
                      <p className="font-medium">Start Analyzing</p>
                      <p className="text-sm text-gray-400">Pull data and generate insights instantly</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="gradient-bg py-14 md:py-20 lg:py-28">
        <div className="container-section">
          <h2 className="section-title">What Our Users Say</h2>
          <p className="section-subtitle">
            Join thousands of SEO professionals who trust our add-on for their data analysis
          </p>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8 mt-8 md:mt-12">
            {testimonials.map((testimonial, index) => (
              <div 
                key={testimonial.name}
                className="bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-800 opacity-0 animate-fade-in"
                style={{ animationDelay: `${index * 200}ms` }}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} size={16} className="text-yellow-500 fill-current" />
                  ))}
                </div>
                <p className="text-gray-300 mb-4 italic">"{testimonial.quote}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-400">{testimonial.role} at {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section id="install" className="py-14 md:py-20 lg:py-28 bg-gray-900">
        <div className="container-section text-center">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold mb-4 md:mb-6">
            Ready to Transform Your SEO Analysis?
          </h2>
          <p className="text-base md:text-lg text-gray-300 mb-8 md:mb-10 max-w-2xl mx-auto">
            Install our Google Sheets Add-on today and start uncovering SEO opportunities you never knew existed.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a 
              href="https://workspace.google.com/marketplace" 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
            >
              <Download size={20} />
              Install from Google Workspace
            </a>
            <a href="#demo" className="btn-secondary flex items-center gap-2 text-lg px-8 py-4">
              <Play size={20} />
              Watch Demo
            </a>
          </div>

          <div className="text-sm text-gray-400">
            Free to install • No credit card required • Works with any Google account
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default GoogleSheetsAddon; 