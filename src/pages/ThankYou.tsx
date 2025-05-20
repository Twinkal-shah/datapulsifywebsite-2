
import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Star, MessageSquare, Puzzle } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const ThankYou = () => {
  useEffect(() => {
    // Show a welcome toast when the page loads
    toast({
      title: "Payment Successful! 🎉",
      description: "Welcome to Datapulsify. Your account is now active."
    });
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-gray-900 to-black">
      <Navbar />
      
      <main className="flex-grow">
        <section className="py-20 md:py-28">
          <div className="container-section">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-8 flex justify-center">
                <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check size={40} className="text-green-500" />
                </div>
              </div>
              
              <h1 className="text-3xl md:text-5xl font-bold mb-6">
                Thank You for Your Purchase!
              </h1>
              
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                Your Datapulsify Lifetime Deal is now active. You have full access to all premium features forever!
              </p>
              
              <div className="bg-black/40 backdrop-blur-sm border border-white/20 rounded-xl p-8 mb-8">
                <h2 className="text-2xl font-bold mb-4">Your Purchase Details</h2>
                <div className="flex justify-between items-center border-b border-gray-800 py-3">
                  <span className="text-gray-300">Plan</span>
                  <span className="font-medium">Lifetime Deal</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 py-3">
                  <span className="text-gray-300">Amount</span>
                  <span className="font-medium">$47.00</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 py-3">
                  <span className="text-gray-300">Email</span>
                  <span className="font-medium">user@example.com</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 py-3">
                  <span className="text-gray-300">Name</span>
                  <span className="font-medium">John Doe</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-800 py-3">
                  <span className="text-gray-300">Row Limit</span>
                  <span className="font-medium">75,000 rows</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-gray-300">Expiration</span>
                  <span className="font-medium text-green-500">Never</span>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row justify-center mb-12">
                <Link to="/contact-us" className="btn-secondary py-3 px-8">
                  Need Help?
                </Link>
              </div>
              
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <MessageSquare className="text-green-400" size={28} />
                    </div>
                    <h3 className="text-xl font-medium mb-3 text-center text-white">
                      Join our WhatsApp Community
                    </h3>
                    <p className="text-gray-300 mb-4 text-center">
                      Connect with other Datapulsify users and share insights
                    </p>
                    <a 
                      href="https://whatsapp.com" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block w-full py-2 px-4 btn-secondary btn-secondary:hover text-center rounded-md transition-colors"
                    >
                      Join Now
                    </a>
                  </CardContent>
                </Card>
                
                <Card className="bg-black/30 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-center mb-4">
                      <Puzzle className="text-blue-400" size={28} />
                    </div>
                    <h3 className="text-xl font-medium mb-3 text-center text-white">
                      Explore Add-ons
                    </h3>
                    <p className="text-gray-300 mb-4 text-center">
                      Enhance your experience with our powerful add-ons
                    </p>
                    <Link 
                      to="/add-ons" 
                      className="block w-full py-2 px-4 btn-secondary btn-secondary:hover text-center rounded-md transition-colors"
                    >
                      Browse Add-ons
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default ThankYou;