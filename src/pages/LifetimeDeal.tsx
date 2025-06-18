import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Clock, Plus, Timer, List, Play } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from '@/components/ui/accordion';
import { toast } from '@/components/ui/use-toast';
import ComparisonTable from '@/components/ComparisonTable';
import TestimonialCard from '@/components/TestimonialCard';
import FeatureCard from '@/components/FeatureCard';
import PricingCalculator from '@/components/PricingCalculator';
import ProgressBar from '@/components/ProgressBar';
import ProductScreenshot from '@/components/ProductScreenshot';

const LifetimeDeal = () => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState({
    days: 3,
    hours: 8,
    minutes: 45,
    seconds: 12
  });

  const [emailInput, setEmailInput] = useState('');
  const [slotsRemaining, setSlotsRemaining] = useState(315);
  const totalSlots = 349;
  const claimedSlots = totalSlots - slotsRemaining;

  useEffect(() => {
    // Update countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else if (prev.days > 0) {
          return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        }
        return prev;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      toast({
        title: "Email Required",
        description: "Please enter your email address to proceed."
      });
      return;
    }

    toast({
      title: "Processing...",
      description: "Taking you to the payment page."
    });
    
    // Simulate a slot being claimed
    setSlotsRemaining(prev => Math.max(0, prev - 1));
    
    // Simulate payment processing and redirect to thank you page
    setTimeout(() => {
      navigate('/thank-you');
    }, 1500);
  };
  
  const testimonials = [
    {
      quote: "Datapulsify has completely transformed how I analyze our GSC data. The one-time lifetime deal was a no-brainer for our agency.",
      name: "Sarah Johnson",
      position: "SEO Director",
      company: "Growth Marketing Inc.",
      rating: 5
    },
    {
      quote: "I've tried many GSC tools, but this is the first one that actually makes large datasets manageable. Worth every penny of the lifetime deal.",
      name: "Michael Chen",
      position: "Digital Strategist",
      company: "Elevate Digital",
      rating: 5
    },
    {
      quote: "Being able to visualize and manipulate large GSC datasets so easily has saved me countless hours. The LTD was the best investment I made this year.",
      name: "Rebecca Torres",
      position: "Freelance SEO Consultant",
      rating: 5
    }
  ];

  const productScreenshots = [
    {
      id: 1,
      src: "/lovable-uploads/1605e731-aa86-4b14-8b2c-5744f77536a9.png",
      alt: "CTR Improvement Dashboard",
      caption: "Track and improve your CTR with detailed keyword insights"
    },
    {
      id: 2,
      src: "/lovable-uploads/21c7adaf-f2ff-4692-84e6-8cf888be9063.png",
      alt: "Quick-Win Analysis",
      caption: "Identify quick-win opportunities for immediate ranking improvements"
    },
    {
      id: 3,
      src: "/lovable-uploads/ee688a90-19b0-4861-9075-bd4e3e057bb3.png",
      alt: "Historical Performance Tracking",
      caption: "Analyze historical performance with comprehensive date-based reporting"
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Navbar />
      
      <main className="flex-grow">
        {/* Hero Section with Video */}
        <section className="gradient-bg py-24 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-hero-pattern bg-no-repeat bg-cover opacity-10"></div>
          <div className="container-section relative z-10">
            <div className="flex flex-col items-center text-center max-w-3xl mx-auto">
              <div className="mb-6 flex items-center space-x-2">
                <Badge variant="outline" className="py-1.5 px-4 text-white border-white/30 bg-white/5 rounded-full">
                  Limited Time Offer
                </Badge>
                <div className="flex items-center bg-white/10 backdrop-blur-sm rounded-full px-3 py-1 border border-white/20">
                  <Clock size={14} className="mr-1.5 text-white/70" />
                  <span className="text-xs font-medium">
                    Ends in {countdown.days}d {countdown.hours}h {countdown.minutes}m
                  </span>
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-6 animate-fade-in leading-tight">
                Get <span className="text-white">Datapulsify</span> for Life
                <span className="text-white/80"> — Just One Payment</span>
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8 animate-fade-in animate-delay-150 max-w-2xl">
                Transform your GSC data into actionable insights with powerful visualization and 
                analytics. Pay once, use forever with our exclusive lifetime deal.
              </p>

              <div className="w-full mb-8">
                <ProgressBar total={totalSlots} claimed={claimedSlots} />
                <p className="text-sm text-amber-400 mt-2 font-medium">
                  Only {slotsRemaining} of {totalSlots} spots remaining! Once they're gone, they're gone forever.
                </p>
              </div>

              <div className="w-full max-w-xl bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-6 mb-8 animate-fade-in animate-delay-300">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4">
                  <div className="mb-4 sm:mb-0">
                    <span className="text-sm text-gray-400 line-through">$108/year</span>
                    <h3 className="text-3xl md:text-4xl font-bold">$47.99</h3>
                    <span className="text-green-500 text-sm">One-time payment</span>
                  </div>
                  <div className="bg-white/10 px-4 py-2 rounded-lg">
                    <p className="text-sm text-center">
                      <span className="font-bold text-green-400">Save $60+ yearly</span><br />
                      <span className="text-xs text-gray-300">Limited-time offer</span>
                    </p>
                  </div>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    className="flex-grow px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:border-white/50"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                  />
                  <button type="submit" className="btn-primary whitespace-nowrap py-3">
                    Claim Your Spot Now
                  </button>
                </form>
                <p className="text-center text-xs text-gray-400 mt-3">
                  60-day money-back guarantee • Secure payment • Instant access
                </p>
              </div>

              <a href="#features" className="flex items-center text-sm text-gray-300 hover:text-white transition-colors">
                <span>Discover all features</span>
                <Check size={14} className="ml-1" />
              </a>
            </div>
          </div>
        </section>
        
        {/* Social Proof */}
        <section className="bg-black py-10">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-16 opacity-75">
              <div className="text-center">
                <div className="font-bold text-2xl md:text-3xl">30+</div>
                <div className="text-sm text-gray-400">Happy Users</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl md:text-3xl">4.9/5</div>
                <div className="text-sm text-gray-400">User Rating</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl md:text-3xl">25,000</div>
                <div className="text-sm text-gray-400">Rows Limit</div>
              </div>
              <div className="text-center">
                <div className="font-bold text-2xl md:text-3xl">60-Day</div>
                <div className="text-sm text-gray-400">Money-Back Guarantee</div>
              </div>
            </div>
          </div>
        </section>

        {/* Real Insights Section */}
        <section id="real-insights" className="py-20 bg-gradient-to-br from-gray-900 to-black">
          <div className="container-section">
            <h2 className="section-title">What You'll Actually See</h2>
            <p className="section-subtitle">
              Real screenshots from actual users showing the powerful insights Datapulsify provides
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
              {productScreenshots.map((screenshot) => (
                <ProductScreenshot 
                  key={screenshot.id}
                  src={screenshot.src}
                  alt={screenshot.alt}
                  caption={screenshot.caption}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* Features Section */}
        <section id="features" className="py-20 bg-black">
          <div className="container-section">
            <h2 className="section-title">Everything You Get With The Lifetime Deal</h2>
            <p className="section-subtitle">
              One payment. Lifetime access. All these powerful features included.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <FeatureCard
                title="25,000 Row Limit"
                description="Process up to 25,000 rows of GSC data at once, perfect for most websites."
                icon={List}
              />
              <FeatureCard
                title="Future Updates"
                description="Get all future updates and improvements to the platform at no additional cost."
                icon={Plus}
              />
              <FeatureCard
                title="Standard Support"
                description="Get help from our support team when you need assistance with the platform."
                icon={Check}
              />
              <FeatureCard
                title="Custom Query Builder"
                description="Create and save powerful custom queries to extract exactly the data you need."
                icon={List}
              />
              <FeatureCard
                title="Automated Scheduling"
                description="Schedule data refreshes and reports to run automatically on your timeline."
                icon={Timer}
              />
              <FeatureCard
                title="Interactive Visualizations"
                description="Transform complex data sets into clear, actionable visualizations and reports."
                icon={Play}
              />
            </div>
          </div>
        </section>
        
        {/* Product Demo/Showcase Section */}
        <section className="py-16 bg-gradient-to-br from-gray-900 to-black">
          <div className="container-section">
            <div className="text-center mb-12">
              <h2 className="section-title">See Datapulsify in Action</h2>
              <p className="section-subtitle">
                Watch how easily you can transform complex GSC data into actionable insights
              </p>
            </div>
            
            <div className="max-w-4xl mx-auto border-2 border-white/20 rounded-xl overflow-hidden shadow-2xl shadow-purple-500/10">
              <div className="aspect-w-16 aspect-h-9 bg-gray-900 flex items-center justify-center">
                <div className="text-center p-8">
                  <Play size={48} className="mx-auto mb-4 text-white" />
                  <h3 className="text-xl font-medium">Product Demo</h3>
                  <p className="text-sm text-gray-400 mt-2">Click to watch a quick demonstration</p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Pricing Comparison Section */}
        <section id="pricing" className="bg-black py-20">
          <div className="container-section">
            <h2 className="section-title">Why Our Lifetime Deal Makes Sense</h2>
            <p className="section-subtitle">
              Compare our one-time lifetime deal with the monthly subscription to see how much you'll save
            </p>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-12">
              <div className="order-2 lg:order-1">
                <ComparisonTable monthlyPrice={9} lifetimePrice={47.99} />
              </div>
              
              <div className="order-1 lg:order-2">
                <PricingCalculator monthlyPrice={9} lifetimePrice={47.99} />
              </div>
            </div>
          </div>
        </section>
        
        {/* Testimonials Section */}
        <section className="py-20 bg-gradient-to-br from-gray-900 to-black">
          <div className="container-section">
            <h2 className="section-title">What Our Users Are Saying</h2>
            <p className="section-subtitle">
              Don't just take our word for it. Here's what data professionals think about Datapulsify.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              {testimonials.map((testimonial, index) => (
                <TestimonialCard
                  key={index}
                  quote={testimonial.quote}
                  name={testimonial.name}
                  position={testimonial.position}
                  company={testimonial.company}
                  rating={testimonial.rating}
                />
              ))}
            </div>
          </div>
        </section>
        
        {/* FAQ Section */}
        <section id="faq" className="bg-black py-20">
          <div className="container-section">
            <h2 className="section-title">Frequently Asked Questions</h2>
            <p className="section-subtitle">
              Still have questions about our lifetime deal? We've got answers.
            </p>
            
            <div className="max-w-3xl mx-auto mt-12">
              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="item-1" className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                    What exactly is included in this lifetime deal?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                    Our lifetime deal includes permanent access to Datapulsify with a 25,000 row limit, 
                    all current features, standard support, and all future updates to the platform. You'll 
                    pay just once ($47.99) and own it forever—no recurring fees or subscriptions.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-2" className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                    What happens if I need more than 25,000 rows?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                    The lifetime deal includes a 25,000 row limit which is sufficient for most users. 
                    If you need more capacity, you can upgrade to our enterprise plan which offers custom row limits. 
                    Your lifetime access will remain intact, and you'll only pay the difference for the additional capacity.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-3" className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                    How long will this lifetime deal be available?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                    This is a strictly limited-time offer available only to the first 349 users. Once all spots are claimed, 
                    we'll close this offer permanently and return to our regular subscription pricing model. 
                    We're limiting the number of lifetime deals to ensure we can provide excellent service to all users.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-4" className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                    Do you offer a money-back guarantee?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                    Yes! We offer a 60-day money-back guarantee. If you're not completely satisfied with Datapulsify 
                    within 60 days of purchase, we'll refund your payment in full. No questions asked.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-5" className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                    Will I get future updates?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                    Absolutely! Your lifetime deal includes all future updates to the platform. You'll always have 
                    access to the latest features and improvements we make to Datapulsify.
                  </AccordionContent>
                </AccordionItem>
                
                <AccordionItem value="item-6" className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                  <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                    How does the licensing work?
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                    Each lifetime license is for a single user account. You can connect multiple GSC properties to your 
                    account, but the account itself cannot be shared among multiple users. If you need licenses for 
                    a team, please contact us about our team discounts.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
        </section>
        
        {/* Call to Action */}
        <section className="bg-black py-20">
          <div className="container-section">
            <div className="bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-gray-800 rounded-2xl p-8 md:p-10 text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-4">
                Ready to transform your GSC data?
              </h2>
              <p className="text-gray-300 mb-8 max-w-2xl mx-auto">
                Join 30+ professionals who've already secured their lifetime access to Datapulsify. 
                Limited spots available — only {slotsRemaining} of {totalSlots} remaining!
              </p>
              
              <div className="flex flex-col sm:flex-row justify-center gap-4 max-w-md mx-auto">
                <a href="#pricing" className="btn-primary py-3 px-8 text-lg font-medium">
                  Claim Your Spot Now
                </a>
                <Link to="/" className="btn-secondary py-3 px-8 text-lg font-medium">
                  Learn More
                </Link>
              </div>
              
              <div className="mt-6 text-sm text-gray-400">
                <p>60-day money-back guarantee • One-time payment of $47.99</p>
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