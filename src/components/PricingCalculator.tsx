
import React, { useState, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

type PricingCalculatorProps = {
  monthlyPrice?: number;
  lifetimePrice?: number;
};

const PricingCalculator: React.FC<PricingCalculatorProps> = ({ 
  monthlyPrice = 9,
  lifetimePrice = 47
}) => {
  const [months, setMonths] = useState<number>(24);
  const [savings, setSavings] = useState<number>(0);
  const [breakEvenMonth, setBreakEvenMonth] = useState<number>(0);

  useEffect(() => {
    const totalMonthlyPrice = monthlyPrice * months;
    const calculatedSavings = totalMonthlyPrice - lifetimePrice;
    setSavings(calculatedSavings);
    
    // Calculate break even point
    const calculatedBreakEven = Math.ceil(lifetimePrice / monthlyPrice);
    setBreakEvenMonth(calculatedBreakEven);
  }, [months, monthlyPrice, lifetimePrice]);

  const handleCopyToClipboard = () => {
    const text = `I'll save $${savings.toFixed(2)} over ${months} months with Datapulsify's Lifetime Deal!`;
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: "You can now share these savings with others."
      });
    });
  };

  return (
    <div className="border border-white/20 rounded-xl p-6 md:p-8 bg-black/40 backdrop-blur-sm">
      <h3 className="text-xl font-bold mb-6">Calculate Your Savings</h3>
      
      <div className="mb-6">
        <label className="block mb-2 font-medium">
          How long do you plan to use Datapulsify?
        </label>
        <div className="flex flex-col space-y-2">
          <input 
            type="range" 
            min="1" 
            max="60" 
            value={months} 
            onChange={(e) => setMonths(parseInt(e.target.value))} 
            className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-sm text-gray-400">
            <span>1 month</span>
            <span>60 months</span>
          </div>
        </div>
        <p className="text-center text-lg mt-2">
          <span className="font-bold">{months}</span> months
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="border border-gray-800 rounded-lg p-4 bg-black/20">
          <h4 className="text-sm text-gray-400 mb-1">Monthly Plan Total</h4>
          <p className="text-2xl font-bold">${(monthlyPrice * months).toFixed(2)}</p>
          <p className="text-sm text-gray-400">${monthlyPrice}/month × {months} months</p>
        </div>
        
        <div className="border border-white/20 rounded-lg p-4 bg-white/5">
          <h4 className="text-sm text-gray-400 mb-1">Lifetime Deal</h4>
          <p className="text-2xl font-bold">${lifetimePrice.toFixed(2)}</p>
          <p className="text-sm text-green-500">One-time payment</p>
        </div>
      </div>
      
      <div className={`p-4 rounded-lg mb-6 ${savings > 0 ? 'bg-green-900/20 border border-green-800' : 'bg-gray-800/20 border border-gray-700'}`}>
        <h4 className="font-medium mb-1">Your Savings</h4>
        <p className="text-2xl font-bold">
          {savings > 0 ? 
            <>${savings.toFixed(2)}</> : 
            <>$0.00</>
          }
        </p>
        {savings <= 0 ? (
          <p className="text-sm text-gray-400">
            You'll break even after {breakEvenMonth} months
          </p>
        ) : (
          <p className="text-sm text-green-400">
            That's a {((savings / (monthlyPrice * months)) * 100).toFixed(0)}% discount!
          </p>
        )}
      </div>
      
      {savings > 0 && (
        <button 
          onClick={handleCopyToClipboard}
          className="w-full py-2 border border-white/30 rounded-lg hover:bg-white/10 transition-colors text-sm"
        >
          Share These Savings
        </button>
      )}
    </div>
  );
};

export default PricingCalculator;