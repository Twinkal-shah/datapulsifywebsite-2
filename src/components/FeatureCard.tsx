
import React from 'react';
import { LucideIcon } from 'lucide-react';

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
};

const FeatureCard: React.FC<FeatureCardProps> = ({ title, description, icon: Icon }) => {
  return (
    <div className="border border-white/10 bg-black/30 backdrop-blur-sm rounded-xl p-6 transition-all hover:border-white/30 hover:translate-y-[-5px]">
      <div className="bg-white/10 rounded-full w-12 h-12 flex items-center justify-center mb-4">
        <Icon className="text-white" size={24} />
      </div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-gray-300">{description}</p>
    </div>
  );
};

export default FeatureCard;