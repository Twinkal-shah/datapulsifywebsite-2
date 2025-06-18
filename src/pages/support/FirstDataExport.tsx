import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Check, Database, Filter, Calendar, BarChart2 } from 'lucide-react';
import { Link } from 'react-router-dom';

const FirstDataExport = () => {
  const steps = [
    {
      title: "Select Your Property",
      description: "Choose which website to analyze",
      icon: Database,
      details: [
        "Log into your Datapulsify dashboard",
        "Click on the property dropdown",
        "Select the website you want to analyze",
        "Verify the property is connected properly"
      ]
    },
    {
      title: "Choose Date Range",
      description: "Pick the time period for your data",
      icon: Calendar,
      details: [
        "Select 'Last 3 months' for your first export",
        "This gives you enough data for meaningful insights",
        "You can adjust this range later as needed",
        "Avoid very recent dates (last 2-3 days) as data may be incomplete"
      ]
    },
    {
      title: "Configure Dimensions",
      description: "Select what data points to include",
      icon: BarChart2,
      details: [
        "Start with basic dimensions: Page and Query",
        "Add Device if you want mobile vs desktop insights",
        "Include Country for international websites",
        "More dimensions = more detailed but larger exports"
      ]
    },
    {
      title: "Apply Filters (Optional)",
      description: "Narrow down your data if needed",
      icon: Filter,
      details: [
        "Filter by specific pages (e.g., blog posts only)",
        "Exclude branded queries if desired",
        "Set minimum impression thresholds",
        "Keep it simple for your first export"
      ]
    }
  ];

  const tips = [
    "Start with a smaller date range for faster processing",
    "Use Page + Query dimensions for content optimization insights",
    "Look for pages with high impressions but low CTR",
    "Identify queries ranking 4-10 for quick SEO wins"
  ];

  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <div className="mb-8">
            <Link to="/support" className="inline-flex items-center text-gray-400 hover:text-white transition-colors mb-4">
              <ArrowLeft size={16} className="mr-2" />
              Back to Support
            </Link>
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Your First Data Export</h1>
            <p className="text-gray-300 text-lg">
              Learn how to configure and run your first Google Search Console data export. 
              We'll walk you through the key settings and best practices.
            </p>
          </div>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mr-4">
                      <step.icon size={24} className="text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-white flex items-center">
                        <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm mr-3">
                          {index + 1}
                        </span>
                        {step.title}
                      </CardTitle>
                      <CardDescription className="text-gray-400">
                        {step.description}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {step.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-start">
                        <Check size={16} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">💡 Pro Tips for Your First Export</h3>
            <ul className="space-y-2">
              {tips.map((tip, index) => (
                <li key={index} className="flex items-start">
                  <Check size={16} className="text-blue-400 mr-2 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-300">{tip}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">Ready to export your data?</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
              <Button variant="outline" className="w-full sm:w-auto hover:bg-black hover:text-white text-black">
                Watch Export Tutorial
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FirstDataExport; 