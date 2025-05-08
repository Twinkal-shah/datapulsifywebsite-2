
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setIsScrolled(scrollPosition > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav 
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled ? 'bg-black/90 backdrop-blur-md py-3 shadow-lg' : 'bg-transparent py-5'
      )}
    >
      <div className="container mx-auto px-4 md:px-8">
        <div className="flex justify-between items-center">
          <Link to="/" className="flex items-center">
            <img 
              src="/lovable-uploads/1b2fd219-c2a6-4b45-bc39-d48916e8e3f5.png" 
              alt="Datapulsify Logo" 
              className="h-10 md:h-12 w-auto transform scale-150"
              style={{ transform: 'scale(3.7)', transformOrigin: 'left' }}
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-10">
            <a href="/#features" className="text-gray-300 hover:text-white transition-colors">Features</a>
            <a href="/#how-it-works" className="text-gray-300 hover:text-white transition-colors">How It Works</a>
            <a href="/#pricing" className="text-gray-300 hover:text-white transition-colors">Pricing</a>
            {/* <Link to="/lifetime-deal" className="text-gray-300 hover:text-white transition-colors">Lifetime Deal</Link> */}
            <a href="/#community" className="text-gray-300 hover:text-white transition-colors">Community</a>
            <a href="/#faq" className="text-gray-300 hover:text-white transition-colors">FAQ</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Login
            </a>
            <Link to="/LifetimeDeal" className="btn-primary">
            Claim Lifetime Deal
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden text-white" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div 
        className={cn(
          'md:hidden absolute w-full bg-black/95 backdrop-blur-md transition-all duration-300 overflow-hidden',
          isMenuOpen ? 'max-h-[500px] py-4 border-t border-gray-800' : 'max-h-0'
        )}
      >
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          <a href="/#features" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            Features
          </a>
          <a href="/#how-it-works" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            How It Works
          </a>
          <a href="/#pricing" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            Pricing
          </a>
          {/* <Link to="/LifetimeDeal" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
          Claim Lifetime Deal
          </Link> */}
          <a href="/#community" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            Community
          </a>
          <a href="/#faq" className="text-gray-300 hover:text-white py-2 transition-colors" onClick={toggleMenu}>
            FAQ
          </a>
          <div className="pt-4 border-t border-gray-800 flex flex-col gap-4">
            <a href="#" className="text-gray-300 hover:text-white transition-colors">
              Login
            </a>
            <Link to="/LifetimeDeal" className="btn-primary text-center" onClick={toggleMenu}>
            Claim Lifetime Deal
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
