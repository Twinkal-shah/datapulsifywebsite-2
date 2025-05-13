
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const RefundPolicy = () => {
  return (
    <div className="min-h-screen flex flex-col w-full bg-black text-white">
      <Navbar />
      <main className="flex-grow pt-32 pb-16">
        <div className="container mx-auto px-4 md:px-8 max-w-4xl">
          <h1 className="text-3xl md:text-4xl font-bold mb-8">Refund Policy</h1>
          
          <p className="text-gray-400 mb-8">Last updated: May 7, 2025</p>
          
          <div className="prose prose-invert max-w-none">
            <p className="mb-8">
              Thank you for choosing <strong>DataPulsify</strong>. We want to ensure your satisfaction with our services.
              This Refund Policy outlines our guidelines for refunds and cancellations.
            </p>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">1. Monthly and Annual Subscriptions</h2>
              <p className="mb-4">
                For monthly and annual subscription plans:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>You may cancel your subscription at any time through your account dashboard.</li>
                <li>When you cancel, you will retain access to the service until the end of your current billing period.</li>
                <li>We do not provide partial refunds for unused time on your subscription.</li>
                <li>After cancellation, no further charges will be made to your payment method.</li>
              </ul>
            </div>
            
            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">2. Lifetime Deal Refunds</h2>
              <p className="mb-4">
                For our lifetime deal offering:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>We offer a 14-day money-back guarantee for lifetime deal purchases.</li>
                <li>To request a refund, contact us at <a href="mailto:harshshah419@gmail.com" className="text-blue-400 hover:text-blue-300">harshshah419@gmail.com</a> within 14 days of your purchase.</li>
                <li>After the 14-day period has elapsed, lifetime deal purchases are non-refundable.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">3. Refund Eligibility</h2>
              <p className="mb-4">
                Refunds may be considered under the following circumstances:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Technical issues that significantly impair the functionality of the service, which our team cannot resolve within a reasonable timeframe.</li>
                <li>Incorrect billing or charging errors.</li>
                <li>Service unavailability for extended periods (more than 48 hours) due to our systems.</li>
              </ul>
              <p className="mb-4">
                Refund requests will be evaluated on a case-by-case basis.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">4. How to Request a Refund</h2>
              <p className="mb-4">
                To request a refund:
              </p>
              <ol className="list-decimal pl-5 mb-4 space-y-2">
                <li>Email us at <a href="mailto:harshshah419@gmail.com" className="text-blue-400 hover:text-blue-300">harshshah419@gmail.com</a> with the subject line "Refund Request".</li>
                <li>Include your account email address and the reason for your refund request.</li>
                <li>For technical issues, please include details of the problem you've experienced.</li>
              </ol>
              <p className="mb-4">
                We aim to respond to all refund requests within 2 business days.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">5. Refund Processing</h2>
              <p className="mb-4">
                If your refund request is approved:
              </p>
              <ul className="list-disc pl-5 mb-4 space-y-2">
                <li>Refunds will be processed using the same payment method used for the original purchase.</li>
                <li>Depending on your payment provider, refunds may take 5-10 business days to appear in your account.</li>
                <li>We reserve the right to suspend or terminate account access once a refund has been processed.</li>
              </ul>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">6. Changes to This Policy</h2>
              <p className="mb-4">
                We may update our Refund Policy from time to time. We will notify all users of any significant changes via email or through an in-app notification.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="text-2xl font-bold mt-8 mb-4">7. Contact Us</h2>
              <p className="mb-4">
                If you have any questions about our Refund Policy, please contact us:
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

export default RefundPolicy;