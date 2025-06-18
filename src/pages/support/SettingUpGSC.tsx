
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, CheckCircle, ExternalLink, AlertTriangle, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

const SettingUpGSC = () => {
  const steps = [
    {
      title: "Create Google Search Console Account",
      description: "If you don't already have one",
      details: [
        "Go to Google Search Console (search.google.com/search-console)",
        "Sign in with your Google account",
        "You'll be redirected to the GSC dashboard"
      ]
    },
    {
      title: "Add Your Website Property",
      description: "Verify ownership of your website",
      details: [
        "Click 'Add Property' in GSC",
        "Choose 'URL prefix' and enter your website URL",
        "Complete verification using one of the provided methods",
        "HTML file upload is usually the easiest method"
      ]
    },
    {
      title: "Wait for Data Collection",
      description: "Google needs time to gather your data",
      details: [
        "Data typically appears within 1-3 minutes in GSC",
        "Historical data may take longer to appear",
        "You need at least some data before connecting to Datapulsify",
        "Check back regularly until you see search performance data"
      ]
    },
    {
      title: "Connect to Datapulsify",
      description: "Link your GSC account with Datapulsify",
      details: [
        "Log into your Datapulsify account",
        "Go to 'Connect Data Sources'",
        "Select 'Google Search Console'",
        "Authorize Datapulsify to access your GSC data",
        "Select the properties you want to analyze"
      ]
    }
  ];

  const verificationMethods = [
    {
      method: "HTML File Upload",
      description: "Download and upload a verification file to your website",
      difficulty: "Easy",
      recommended: true
    },
    {
      method: "HTML Meta Tag",
      description: "Add a meta tag to your homepage HTML",
      difficulty: "Medium",
      recommended: false
    },
    {
      method: "Google Analytics",
      description: "Use existing Google Analytics account",
      difficulty: "Easy",
      recommended: true
    },
    {
      method: "Google Tag Manager",
      description: "Use existing GTM container",
      difficulty: "Easy",
      recommended: false
    },
    {
      method: "DNS Record",
      description: "Add a TXT record to your domain's DNS",
      difficulty: "Hard",
      recommended: false
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
            <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Setting up Google Search Console</h1>
            <p className="text-gray-300 text-lg">
              Google Search Console is required to use Datapulsify. This guide will walk you through 
              setting up GSC and connecting it to your Datapulsify account.
            </p>
          </div>

          <Alert className="mb-8 border-blue-500/30 bg-blue-500/10">
            <Clock className="h-4 w-4 text-blue-400" />
            <AlertDescription className="text-blue-100">
              <strong>Important:</strong> You need an existing website with some search traffic to use Google Search Console. 
              Brand new websites may not have any data to analyze yet.
            </AlertDescription>
          </Alert>

          <div className="space-y-8">
            {steps.map((step, index) => (
              <Card key={index} className="bg-gray-900 border-gray-800">
                <CardHeader>
                  <CardTitle className="text-white flex items-center">
                    <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm mr-3">
                      {index + 1}
                    </span>
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-gray-400 ml-11">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="ml-11">
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

          {/* Verification Methods */}
          <div className="mt-12">
            <h2 className="text-2xl font-bold mb-6 text-white">Verification Methods</h2>
            <p className="text-gray-300 mb-8">
              Google offers several ways to verify ownership of your website. Here are the most common methods:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {verificationMethods.map((method, index) => (
                <Card key={index} className={`bg-gray-900 border-gray-800 ${method.recommended ? 'ring-1 ring-green-500/30' : ''}`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white text-lg">{method.method}</CardTitle>
                      {method.recommended && (
                        <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded">
                          Recommended
                        </span>
                      )}
                    </div>
                    <CardDescription className="text-gray-400">
                      {method.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Difficulty:</span>
                      <span className={`text-sm ${
                        method.difficulty === 'Easy' ? 'text-green-400' :
                        method.difficulty === 'Medium' ? 'text-yellow-400' :
                        'text-red-400'
                      }`}>
                        {method.difficulty}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="mt-12 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
            <div className="flex items-start">
              <AlertTriangle className="text-yellow-400 mr-3 mt-1" size={20} />
              <div>
                <h3 className="text-lg font-semibold mb-2 text-yellow-400">Common Issues</h3>
                <ul className="space-y-2 text-gray-300">
                  <li>• <strong>No data showing:</strong> Wait longer or check if your site has search traffic</li>
                  <li>• <strong>Verification failed:</strong> Make sure the verification file/tag is accessible</li>
                  <li>• <strong>Property not found:</strong> Check that you entered the correct URL format</li>
                  <li>• <strong>Permission denied:</strong> Ensure you have admin access to the GSC property</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Next Steps */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-semibold mb-4 text-white">Ready to connect your data?</h3>
            <p className="text-gray-400 mb-6">
              Once you have Google Search Console set up and data flowing, you can connect it to Datapulsify.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button className="w-full sm:w-auto">
                Connect to Datapulsify
              </Button>
              <Button variant="outline" className="w-full sm:w-auto text-white hover:text-white hover:bg-black text-black">
                <ExternalLink className="mr-2" size={16} />
                Open Google Search Console
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SettingUpGSC;