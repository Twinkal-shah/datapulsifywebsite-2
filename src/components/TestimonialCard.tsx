
import React from 'react';
import { Star } from 'lucide-react';

type TestimonialProps = {
  quote: string;
  name: string;
  position: string;
  company?: string;
  rating: number;
};

const TestimonialCard: React.FC<TestimonialProps> = ({ 
  quote, 
  name, 
  position, 
  company, 
  rating 
}) => {
  return (
    <div className="border border-white/20 bg-black/40 backdrop-blur-sm rounded-xl p-6 h-full flex flex-col hover:border-white/30 transition-all">
      <div className="flex mb-4">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`w-4 h-4 ${i < rating ? "text-yellow-500 fill-yellow-500" : "text-gray-500"}`} 
          />
        ))}
      </div>
      <blockquote className="text-gray-300 italic mb-6 flex-grow">
        "{quote}"
      </blockquote>
      <div className="mt-auto">
        <p className="font-semibold">{name}</p>
        <p className="text-gray-400 text-sm">{position}{company ? `, ${company}` : ''}</p>
      </div>
    </div>
  );
};

export default TestimonialCard;