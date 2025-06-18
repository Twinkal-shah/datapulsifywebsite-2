import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Book, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const Documentation = () => {
  const docSections = [
    {
      title: 'Getting Started',
      icon: Book,
      description: 'Everything you need to know to get started with Datapulsify',
      articles: [
        { title: 'Quick Start Guide', link: '/support/quick-start-guide', description: 'Get up and running in under 10 minutes' },
        { title: 'Setting up Google Search Console', link: '/support/setting-up-gsc', description: 'Connect your GSC account to Datapulsify' },
        { title: 'Your First Data Export', link: '/support/first-data-export', description: 'Learn how to export your first dataset' },
        { title: 'Installing the Add-on', link: '/support/google-addon', description: 'Step-by-step installation guide' }
      ]
    }
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-6 text-center">Documentation</h1>
          <p className="text-gray-400 text-lg max-w-2xl mx-auto text-center mb-12">
            Everything you need to know about using Datapulsify effectively.
          </p>

          {/* Documentation Sections */}
          <div className="grid gap-8">
            {docSections.map((section, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <div className="p-6">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <section.icon size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-white">{section.title}</h2>
                      <p className="text-gray-400">{section.description}</p>
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    {section.articles.map((article, articleIndex) => (
                      <Link key={articleIndex} to={article.link} className="block p-4 bg-gray-800 rounded-lg hover:bg-gray-750 transition-colors">
                        <h3 className="font-medium text-white mb-2">{article.title}</h3>
                        <p className="text-sm text-gray-400">{article.description}</p>
                      </Link>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Contact Support Section */}
          <div className="mt-12 text-center p-8 bg-gray-900 rounded-xl border border-gray-800">
            <h2 className="text-2xl font-semibold mb-4">Still Have Questions?</h2>
            <p className="text-gray-400 mb-6">
              Our support team is here to help you get the most out of Datapulsify.
            </p>
            <Link to="/contact">
              <Button size="lg" className="gap-2">
                <MessageCircle size={20} />
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

export default Documentation;