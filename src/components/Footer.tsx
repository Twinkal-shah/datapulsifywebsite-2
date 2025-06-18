import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Twitter, Linkedin, Youtube, MessageCircle } from 'lucide-react';
import { scrollToTop } from '@/utils/scrollUtils';

const Footer = () => {
  const navigate = useNavigate();
  
  const handleSmoothNavigation = (path: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    navigate(path);
    scrollToTop();
  };

  return (
    <footer className="bg-black text-white border-t border-gray-800">
      <div className="container mx-auto px-4 md:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Datapulsify</h2>
              <p className="text-gray-400 text-sm">
                Built for SEO & Data Professionals.
              </p>
            </div>
            
            <div className="flex space-x-4 mb-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="Twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="LinkedIn">
                <Linkedin size={20} />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors" aria-label="YouTube">
                <Youtube size={20} />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Product</h3>
            <ul className="space-y-2">
              <li><a href="/#features" className="text-gray-400 hover:text-white transition-colors">Features</a></li>
              <li><a href="/#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</a></li>
              <li><Link to="/support" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/support')}>Support</Link></li>
              <li><a href="/#faq" className="text-gray-400 hover:text-white transition-colors">FAQ</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2">
              <li><Link to="/about" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/about')}>About Us</Link></li>
              <li><Link to="/waitlist" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/waitlist')}>Join Waitlist</Link></li>
              <li><Link to="/privacy" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/privacy')}>Privacy Policy</Link></li>
              <li><Link to="/terms" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/terms')}>Terms of Service</Link></li>
              <li><Link to="/refund" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/refund')}>Refund Policy</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-white transition-colors" onClick={handleSmoothNavigation('/contact')}>Contact Us</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} Datapulsify. All rights reserved.
          </p>
          
          <div className="flex items-center space-x-4">
            <Link to="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors" onClick={handleSmoothNavigation('/privacy')}>
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-gray-400 hover:text-white text-sm transition-colors" onClick={handleSmoothNavigation('/terms')}>
              Terms of Service
            </Link>
            <Link to="/contact" className="text-gray-400 hover:text-white text-sm transition-colors flex items-center" onClick={handleSmoothNavigation('/contact')}>
              <MessageCircle size={16} className="mr-1" />
              Contact
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
