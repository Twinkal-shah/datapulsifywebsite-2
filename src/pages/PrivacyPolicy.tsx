import React, { useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { scrollToTop } from '@/utils/scrollUtils';

const PrivacyPolicy = () => {
  useEffect(() => {
    scrollToTop();
  }, []);

  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Privacy Policy</h1>
          
          <p className="text-gray-400 mb-8">Last updated: May 7, 2025</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="mb-8">
              At <strong>DataPulsify</strong>, we are committed to protecting your privacy and ensuring 
              the security of your personal data. This Privacy Policy explains how we collect, use, store, 
              and protect your information when you use our service, which extracts and syncs data from 
              <strong> Google Search Console</strong> to <strong>Google Sheets</strong>.
            </p>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Who We Are</h2>
              <p>
                DataPulsify is a tool designed to help users seamlessly transfer and analyze Google Search Console 
                data within Google Sheets. This policy outlines how we handle the data you share with us through this process.
              </p>
            </div>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Information We Collect</h2>
              <p className="mb-4">We may collect and store the following information:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><strong>Personal Identifiers</strong>: Your name and email address.</li>
                <li><strong>OAuth-Scoped Data</strong>: Google Sheets access, Google Search Console access.</li>
                <li><strong>Business/Freelancing Information</strong>: Any business-related data you voluntarily share.</li>
                <li><strong>Technical Metadata</strong>: IP address, browser type, and usage logs (if applicable).</li>
              </ul>
            </div>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">3. How We Use Your Information</h2>
              <p className="mb-4">We use the collected data to:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Provide core features of the DataPulsify tool.</li>
                <li>Improve the quality, performance, and usability of the service.</li>
                <li>Respond to user support and inquiries.</li>
                <li>Analyze anonymized, aggregated data to improve our offerings.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">4. Legal Basis for Processing (GDPR)</h2>
              <p className="mb-4">
                Under the General Data Protection Regulation (GDPR), we process your data based on the following legal grounds:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><strong>Consent</strong> – You grant us permission via OAuth.</li>
                <li><strong>Contractual Necessity</strong> – To deliver the features and services promised.</li>
                <li><strong>Legitimate Interests</strong> – For ensuring security, preventing fraud, and improving the platform.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">5. How We Store and Protect Your Data</h2>
              <p className="mb-4">
                Your data is securely stored using <strong>Supabase</strong>, which employs modern security practices including:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Data encryption in transit and at rest.</li>
                <li>Secure servers and authentication systems.</li>
                <li>Role-based access control to limit data access to only necessary team members.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Third-Party Sharing</h2>
              <p className="mb-4">
                We <strong>do not sell, rent, or share</strong> your personal data with third parties except 
                where necessary to provide the core functionality of the service.
              </p>
              <p className="mb-4">
                We use <strong>Supabase</strong> as our data storage provider. You can read their 
                <a href="https://supabase.com/privacy" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer"> privacy policy here</a>.
              </p>
              <p className="mb-4 italic bg-gray-800 p-4 rounded">
                <strong>Google API Disclosure</strong>: Our use and transfer to any other app of information 
                received from Google APIs will adhere to the 
                <a href="https://developers.google.com/terms/api-services-user-data-policy" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer"> Google API Services User Data Policy</a>, 
                including the Limited Use requirements.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Your Rights Under GDPR</h2>
              <p className="mb-4">As a user, you have the following rights:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li><strong>Access</strong> – Request access to the personal data we hold about you.</li>
                <li><strong>Rectification</strong> – Ask us to correct inaccurate data.</li>
                <li><strong>Erasure</strong> – Request the deletion of your data.</li>
                <li><strong>Restriction</strong> – Limit how we process your data.</li>
                <li><strong>Withdrawal of Consent</strong> – You can revoke consent at any time without affecting the lawfulness of prior processing.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">8. Data Retention</h2>
              <p className="mb-4">We retain your data only as long as necessary:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>For as long as your account is active.</li>
                <li>Or until you revoke access or delete your account via your dashboard.</li>
                <li>We may retain anonymized data for analysis purposes.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">9. How to Revoke Access or Delete Your Data</h2>
              <p className="mb-4">You can manage or revoke your data access at any time:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Visit <a href="https://datapulsify.com/dashboard" className="text-blue-400 hover:text-blue-300" target="_blank" rel="noopener noreferrer">datapulsify.com/dashboard</a> to manage or delete your account.</li>
                <li>Alternatively, contact us at <a href="mailto:harshshah419@gmail.com" className="text-blue-400 hover:text-blue-300">harshshah419@gmail.com</a> for any data-related requests.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">10. Cookies and Tracking</h2>
              <p className="mb-4">We use cookies on our dashboard to:</p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Automatically log you in based on your installation of the add-on.</li>
                <li>Enhance your user experience and reduce friction during login.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">11. Changes to This Privacy Policy</h2>
              <p className="mb-4">
                We may update this Privacy Policy periodically. You will be notified of any significant 
                changes via email or an in-app notification.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">12. Contact Us</h2>
              <p className="mb-4">
                If you have questions or concerns about this Privacy Policy or your data, please reach out to us at:
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

export default PrivacyPolicy;