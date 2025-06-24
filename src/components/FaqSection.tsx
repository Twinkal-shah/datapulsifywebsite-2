
import React from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "Do I need both the add-on and dashboard?",
    answer: "You get both! Use whichever fits your workflow. Many users start with sheets and fall in love with the dashboard for client presentations."
  },
  {
    question: "Will this work with my existing GSC setup?",
    answer: "Yes! Works with any Google Search Console account. No changes needed to your current setup."
  },
  {
    question: "What happens when I hit 25,000 rows?",
    answer: "That covers 99% of websites. If you need more, we'll work out a custom solution that's still way cheaper than monthly tools."
  },
  {
    question: "Is this really built by an SEO?",
    answer: "Yep! 8 years in the trenches. Every feature exists because I needed it myself."
  },
  {
    question: "What if I hate it?",
    answer: "60-day refund. But you won't hate it – you'll wonder how you lived without it."
  }
];

const FaqSection = () => {
  return (
    <section id="faq" className="gradient-bg py-12 md:py-20">
      <div className="container-section">
        <h2 className="section-title">Questions? I've Got Answers.</h2>

        <div className="max-w-3xl mx-auto mt-12 opacity-0 animate-fade-in">
          <Accordion type="single" collapsible className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border border-white/20 rounded-lg overflow-hidden bg-black/30 backdrop-blur-sm">
                <AccordionTrigger className="px-6 py-4 text-left hover:bg-white/5 transition-colors text-lg font-semibold">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="px-6 pb-4 pt-2 text-gray-300 text-base leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
};

export default FaqSection;