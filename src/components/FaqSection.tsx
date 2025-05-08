
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "How does Datapulsify connect to GSC?",
    answer: "Datapulsify uses secure OAuth2 authentication to connect to your Google Search Console account. Once you authorize access, you can start pulling data without sharing your password or sensitive information."
  },
  {
    question: "Can I schedule automatic data syncs?",
    answer: "Automatic data syncs are currently in development and will be released soon. This feature will allow you to set up recurring syncs on a schedule you define, ensuring your reports are always up-to-date."
  },
  {
    question: "Do you offer team accounts?",
    answer: "Yes, our Enterprise plan supports team accounts with custom permissions and access controls. Contact us for detailed information about team pricing and setup."
  },
  {
    question: "How much historical data can I access?",
    answer: "Datapulsify allows you to access all the historical data available in your Google Search Console, which is typically 16 months of search performance data."
  },
  {
    question: "Is my data secure with Datapulsify?",
    answer: "Yes, security is our top priority. We use industry-standard encryption and security practices. We never store your GSC credentials, and your data is processed securely through our system."
  },
  {
    question: "Can I cancel my subscription at any time?",
    answer: "Absolutely! You can cancel your subscription at any time with no questions asked. Your account will remain active until the end of your current billing period."
  }
];

const FaqSection = () => {
  return (
    <section id="faq" className="bg-black py-20 md:py-32 p-0">
      <div className="container-section">
        <h2 className="section-title">Frequently Asked Questions</h2>
        <p className="section-subtitle">
          Got questions? We've got answers. If you don't see what you're looking for, reach out to our team.
        </p>

        <div className="max-w-3xl mx-auto mt-12 opacity-0 animate-fade-in">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-gray-800 rounded-lg overflow-hidden bg-gray-900/50">
                <AccordionTrigger className="px-6 py-4 text-left hover:bg-gray-800/50 transition-colors">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2 text-gray-300">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="mt-16 text-center opacity-0 animate-fade-in animate-delay-300">
          <h3 className="text-xl font-semibold mb-4">Still have questions?</h3>
          <a href="#" className="btn-secondary">
            Contact Support
          </a>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;
