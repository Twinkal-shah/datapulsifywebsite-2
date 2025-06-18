
import React from 'react';
import { Check, X } from 'lucide-react';

type PlanFeature = {
  name: string;
  monthly: boolean;
  lifetime: boolean;
};

type ComparisonTableProps = {
  monthlyPrice?: number;
  lifetimePrice?: number;
};

const ComparisonTable: React.FC<ComparisonTableProps> = ({ 
  monthlyPrice = 9,
  lifetimePrice = 47 
}) => {
  const features: PlanFeature[] = [
    { name: "All core GSC data", monthly: true, lifetime: true },
    { name: "Custom query builder", monthly: true, lifetime: true },
    { name: "Data visualizations", monthly: true, lifetime: true },
    { name: "Future updates", monthly: false, lifetime: true },
    { name: "Priority support", monthly: false, lifetime: true },
    { name: "One-time payment", monthly: false, lifetime: true },
    { name: "75,000 rows limit", monthly: false, lifetime: true },
    { name: "Recurring monthly fee", monthly: true, lifetime: false },
  ];

  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="py-4 px-4 text-left border-b border-gray-800"></th>
            <th className="py-4 px-4 text-center border-b border-gray-800">
              <div className="text-lg font-semibold">Monthly Plan</div>
              <div className="text-sm text-gray-400 mt-1">${monthlyPrice}/month</div>
            </th>
            <th className="py-4 px-4 text-center border-b border-gray-800 bg-white/5">
              <div className="text-lg font-semibold text-white">Lifetime Deal</div>
              <div className="text-sm text-green-500 mt-1">${lifetimePrice} (one-time)</div>
            </th>
          </tr>
        </thead>
        <tbody>
          {features.map((feature, index) => (
            <tr key={index} className={index % 2 === 0 ? "bg-black/20" : "bg-black/40"}>
              <td className="py-3 px-4 border-b border-gray-800">{feature.name}</td>
              <td className="py-3 px-4 text-center border-b border-gray-800">
                {feature.monthly ? (
                  <Check className="inline-block text-green-500" size={18} />
                ) : (
                  <X className="inline-block text-red-500" size={18} />
                )}
              </td>
              <td className="py-3 px-4 text-center border-b border-gray-800 bg-white/5">
                {feature.lifetime ? (
                  <Check className="inline-block text-green-500" size={18} />
                ) : (
                  <X className="inline-block text-red-500" size={18} />
                )}
              </td>
            </tr>
          ))}
          <tr>
            <td className="py-4 px-4"></td>
            <td className="py-4 px-4 text-center">
              <button className="btn-secondary py-2 px-4 text-sm">Subscribe Monthly</button>
            </td>
            <td className="py-4 px-4 text-center bg-white/5">
              <button className="btn-primary py-2 px-4 text-sm">Get Lifetime Access</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ComparisonTable;