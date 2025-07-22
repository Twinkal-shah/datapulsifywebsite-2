import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { scrollToTop } from '@/utils/scrollUtils';

const TermsOfService = () => {
  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Terms and Conditions</h1>
          
          <p className="text-gray-400 mb-8">Effective Date: May 7, 2025</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="mb-8">
              Welcome to <strong>DataPulsify</strong>. These Terms and Conditions ("Terms") govern your use of the DataPulsify Google Sheets Add-on, website, and associated services ("Service"), operated by <strong>DataPulsify</strong> ("we", "us", or "our"). By accessing or using our Service, you agree to be bound by these Terms. If you do not agree with any part of these Terms, please do not use the Service.
            </p>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Definitions</h2>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><strong>"Service"</strong> refers to the DataPulsify Add-on, dashboard, and all related features.</li>
                <li><strong>"User"</strong> or <strong>"You"</strong> refers to any individual or entity using the Service.</li>
                <li><strong>"Personal Data"</strong> means data such as your name, email address, Google Sheets and Google Search Console access, and business information.</li>
              </ul>
            </div>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Eligibility</h2>
              <p className="mb-4">To use our Service, you must:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Be at least 18 years of age, or have the legal capacity to enter into a binding agreement.</li>
                <li>Use a valid Google Account with appropriate permissions to grant access to Google Sheets and Google Search Console.</li>
              </ul>
            </div>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Your Responsibilities</h2>
              <p className="mb-4">By using DataPulsify, you agree that:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>You will provide accurate, current, and complete information.</li>
                <li>You will not misuse the Service in any way, including but not limited to copying, reselling, reverse engineering, or interfering with system functionality.</li>
                <li>You will comply with all applicable laws, including Google's Terms of Service and API policies.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Access and Permissions</h2>
              <p className="mb-4">
                By installing and using our add-on, you authorize DataPulsify to access your Google Sheets and Google Search Console data solely to deliver the intended features. We handle this data in accordance with our <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>.
              </p>
              <p className="mb-4 italic bg-gray-800 p-4 rounded">
                Our use and transfer of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">Google API Services User Data Policy</a>, including the Limited Use requirements.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">5. Availability of Service</h2>
              <p className="mb-4">
                We strive to maintain uninterrupted access, but we do not guarantee continuous availability. The Service may be suspended or discontinued at any time for maintenance, upgrades, or due to external factors.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Payments and Subscriptions</h2>
              <p className="mb-4">
                If you subscribe to a paid plan, billing terms will be presented at checkout. You may cancel at any time, but fees already paid are non-refundable unless otherwise required by law.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Termination</h2>
              <p className="mb-4">
                We may suspend or terminate your access if you violate these Terms. You may also stop using the Service at any time and revoke access via <a href="https://app.datapulsify.com/dashboard" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">app.datapulsify.com/dashboard</a>.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">8. Limitation of Liability</h2>
              <p className="mb-4">To the maximum extent permitted by law:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>We are not liable for indirect, incidental, or consequential damages arising from your use of the Service.</li>
                <li>We do not guarantee the accuracy of data synced between platforms.</li>
                <li>You assume full responsibility for any actions taken based on the data provided by our Service.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">9. Intellectual Property</h2>
              <p className="mb-4">
                All content, features, branding, and code associated with DataPulsify are owned by us or our licensors and are protected by intellectual property laws. You may not reuse or repurpose any portion of our platform without written permission.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">10. Privacy</h2>
              <p className="mb-4">
                Your use of the Service is subject to our <Link to="/privacy-policy" className="text-blue-400 hover:text-blue-300">Privacy Policy</Link>, which explains how we collect, store, and use your data. By using DataPulsify, you consent to our data practices outlined there.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">11. Governing Law</h2>
              <p className="mb-4">
                These Terms are governed by and interpreted in accordance with the laws of the United States, without regard to its conflict of law principles.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">12. Changes to These Terms</h2>
              <p className="mb-4">
                We reserve the right to modify or replace these Terms at any time. We will notify you via email or an in-app alert if we make material changes. Continued use of the Service constitutes your acceptance of the new Terms.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">13. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about these Terms, you can contact us at:
              </p>
              <p className="mb-2">
                <strong>Email:</strong> <a href="mailto:harshshah419@gmail.com" className="text-blue-400 hover:text-blue-300">harshshah419@gmail.com</a>
              </p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TermsOfService;