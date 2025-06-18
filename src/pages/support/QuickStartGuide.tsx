
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Play, Download, Settings } from 'lucide-react';
import { Link } from 'react-router-dom';

const QuickStartGuide = () => {
  const steps = [
    {
      title: "Connect Google Search Console",
      description: "Authorize Datapulsify to access your GSC data",
      icon: Settings,
      details: [
        "Go to your Datapulsify dashboard",
        "Click 'Connect GSC Account'",
        "Authorize with your Google account",
        "Select the properties you want to analyze"
      ]
    },
    {
      title: "Choose Your Export Method",
      description: "Select between Google Sheets add-on or dashboard",
      icon: Download,
      details: [
        "Google Sheets: Install our add-on for familiar spreadsheet analysis",
        "Dashboard: Use our web interface for advanced visualizations",
        "Both work with the same data - pick what fits your workflow"
      ]
    },
    {
      title: "Set Up Your First Query",
      description: "Configure what data you want to analyze",
      icon: Play,
      details: [
        "Select date range (last 3 months recommended for starters)",
        "Choose dimensions: Page, Query, Device, Country",
        "Set any filters if needed",
        "Click 'Run Analysis' to see your data"
      ]
    },
    {
      title: "Explore Your Insights",
      description: "Start analyzing your search performance",
      icon: CheckCircle,
      details: [
        "Look for pages with high impressions but low CTR",
        "Identify queries where you rank 4-10 for quick wins",
        "Check mobile vs desktop performance differences",
        "Export data for further analysis or reporting"
      ]
    }
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
            <div className="flex items-center gap-3 mb-4">
              <h1 className="text-3xl md:text-4xl font-bold">Quick Start Guide</h1>
              <Badge variant="secondary" className="bg-green-500/20 text-green-400 border-green-500/30">
                New
              </Badge>
            </div>
            <p className="text-gray-300 text-lg">
              Get up and running with Datapulsify in under 10 minutes. This guide will walk you through 
              connecting your Google Search Console and running your first analysis.
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
                        <CheckCircle size={16} className="text-green-400 mr-2 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-300">{detail}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-12 bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-blue-400">🎉 You're All Set!</h3>
            <p className="text-gray-300 mb-4">
              Congratulations! You've successfully set up Datapulsify. You should now be able to see your 
              Google Search Console data in an easy-to-analyze format.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="w-full sm:w-auto">
                Go to Dashboard
              </Button>
              <Button variant="outline" className="w-full sm:w-auto text-black hover:bg-black hover:text-white">
                Watch Video Tutorial
              </Button>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">Need help? We're here for you!</p>
            <Link to="/contact">
              <Button variant="outline" className="text-black hover:bg-black hover:text-white">Contact Support</Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default QuickStartGuide;