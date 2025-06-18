import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  MessageCircle, 
  Mail, 
  FileText, 
  HelpCircle, 
  Book, 
  CreditCard, 
  Users,
  Zap
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Support = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  
  // Function for smooth transition and scroll to top
  const handleSmoothNavigation = (e) => {
    e.preventDefault();
    const path = e.currentTarget.getAttribute('href') || e.currentTarget.getAttribute('to');
    
    // Use React Router for smooth client-side navigation
    navigate(path);
    
    // Optionally scroll to top
    window.scrollTo(0, 0);
  };

  const supportCategories = [
    {
      title: 'Getting Started',
      icon: Book,
      description: 'Learn the basics of using Datapulsify',
      articles: [
        { title: 'Quick Start Guide', isNew: true, link: '/support/quick-start-guide' },
        { title: 'Setting up Google Search Console', isNew: false, link: '/support/setting-up-gsc' },
        { title: 'Installing the Google Sheets Add-on', isNew: false, link: '/support/google-sheets-addon' },
        { title: 'Your First Data Export', isNew: false, link: '/support/first-data-export' }
      ]
    },
    {
      title: 'Account & Billing',
      icon: CreditCard,
      description: 'Manage your account and subscription',
      articles: [
        { title: 'Lifetime Deal FAQ', isNew: false, link: '/lifetimedeal' },
        { title: 'Refund Policy', isNew: false, link: '/refundpolicy', onClick: handleSmoothNavigation }
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Contact Support',
      description: 'Get help from our team',
      icon: MessageCircle,
      action: 'contact',
      color: 'bg-blue-500'
    },
    {
      title: 'Documentation',
      description: 'Browse our full docs',
      icon: FileText,
      action: 'docs',
      color: 'bg-green-500'
    },
    {
      title: 'Community',
      description: 'Join our WhatsApp group',
      icon: Users,
      action: 'community',
      color: 'bg-purple-500'
    }
  ];

  const filteredCategories = supportCategories.filter(category =>
    category.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.articles.some(article => 
      article.title.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const handleLiveChat = () => {
    // In a real implementation, this would open a live chat widget
    console.log('Opening live chat...');
    alert('Live chat would open here in a real implementation');
  };

  const handleWhatsAppGroup = () => {
    window.open('https://chat.whatsapp.com/your-group-link', '_blank');
  };

  
  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-white">
              How can we help you?
            </h1>
            <p className="text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              Find answers to your questions, learn how to use Datapulsify, or get in touch with our support team.
            </p>
            
            {/* Search Bar */}
            <div className="relative max-w-md mx-auto">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <Input
                type="text"
                placeholder="Search for help..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-gray-900 border-gray-700 text-white placeholder-gray-400"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {quickActions.map((action, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800 hover:border-gray-700 transition-colors cursor-pointer">
                <CardHeader className="text-center">
                  <div className={`mx-auto w-16 h-16 ${action.color} rounded-full flex items-center justify-center mb-4`}>
                    <action.icon size={28} className="text-white" />
                  </div>
                  <CardTitle className="text-white">{action.title}</CardTitle>
                  <CardDescription className="text-gray-400">
                    {action.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  {action.action === 'contact' && (
                    <Link to="/contact" onClick={handleSmoothNavigation}>
                      <Button className="w-full">Get Support</Button>
                    </Link>
                  )}
                  {action.action === 'docs' && (
                    <Link to="/documentation" onClick={handleSmoothNavigation}>
                      <Button className="w-full" variant="outline">
                        Browse Docs
                      </Button>
                    </Link>
                  )}
                  {action.action === 'community' && (
                    <Button className="w-full" variant="outline" onClick={handleWhatsAppGroup}>
                      Join WhatsApp Group
                    </Button>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Support Categories */}
          <div className="mb-16">
            <h2 className="text-3xl font-bold mb-8 text-center text-white">Browse by Category</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {filteredCategories.map((category, index) => (
                <Card key={index} className="bg-gray-900 border-gray-800">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                        <category.icon size={24} className="text-blue-400" />
                      </div>
                      <div>
                        <CardTitle className="text-white">{category.title}</CardTitle>
                        <CardDescription className="text-gray-400">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {category.articles.map((article, articleIndex) => (
                        <li key={articleIndex} className="flex items-center justify-between">
                          {article.link.startsWith('/') ? (
                            <Link 
                              to={article.link} 
                              className="text-gray-300 hover:text-white transition-colors text-left"
                              onClick={handleSmoothNavigation}
                            >
                              {article.title}
                            </Link>
                          ) : (
                            <a 
                              href={article.link} 
                              className="text-gray-300 hover:text-white transition-colors text-left"
                              onClick={handleSmoothNavigation}
                            >
                              {article.title}
                            </a>
                          )}
                          {article.isNew && (
                            <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                              New
                            </Badge>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Contact Section */}
          <div className="mt-12 bg-gray-900 rounded-xl p-8 border border-gray-800 text-center">
            <h3 className="text-2xl font-semibold mb-4 text-white">Still Have Questions?</h3>
            <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help you get the most out of Datapulsify.
            </p>
            <Link to="/contact" onClick={handleSmoothNavigation}>
              <Button size="lg" className="w-full sm:w-auto">
                Contact Support
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Support; 