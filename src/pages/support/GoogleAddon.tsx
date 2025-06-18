
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, Download, ExternalLink, Play } from 'lucide-react';
import { Link } from 'react-router-dom';

const GoogleAddon = () => {
  const steps = [
    {
      title: "Install the Add-on",
      description: "Get Datapulsify from Google Workspace Marketplace",
      icon: Download,
      details: [
        "Open Google Sheets in your browser",
        "Go to Extensions > Add-ons > Get add-ons",
        "Search for 'Datapulsify'",
        "Click 'Install' and authorize the add-on"
      ]
    },
    {
      title: "Connect Your Account",
      description: "Link your Datapulsify account to the add-on",
      icon: ExternalLink,
      details: [
        "In Google Sheets, go to Extensions > Datapulsify",
        "Click 'Sign In' from the sidebar",
        "Enter your Datapulsify credentials",
        "Authorize access to your data"
      ]
    },
    {
      title: "Configure Your Export",
      description: "Set up your first data export",
      icon: Play,
      details: [
        "Select your GSC property from the dropdown",
        "Choose date range (last 3 months recommended)",
        "Pick dimensions: Page, Query, Device, Country",
        "Set any filters if needed"
      ]
    },
    {
      title: "Export Your Data",
      description: "Get your GSC data directly in sheets",
      icon: CheckCircle,
      details: [
        "Click 'Export Data' to run the query",
        "Data will populate in your current sheet",
        "Use Google Sheets features for analysis",
        "Set up automatic refreshes if needed"
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Installing the Google Sheets Add-on</h1>
            <p className="text-gray-300 text-lg">
              Get your Google Search Console data directly in Google Sheets with our powerful add-on. 
              Perfect for analysis, reporting, and sharing with your team.
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

          <div className="mt-12 bg-green-500/10 border border-green-500/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold mb-4 text-green-400">🎉 Add-on Installed Successfully!</h3>
            <p className="text-gray-300 mb-4">
              You can now export your Google Search Console data directly to Google Sheets. 
              The add-on will appear in your Extensions menu for all future sheets.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button className="w-full sm:w-auto">
                Open Google Sheets
              </Button>
              <Button variant="outline" className="w-full sm:w-auto hover:bg-black hover:text-white text-black">
                View Tutorial Video
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default GoogleAddon;