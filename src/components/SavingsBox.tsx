
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { DollarSign } from 'lucide-react';

const SavingsBox: React.FC = () => {
  const { totalSaved, monthlyProjection, yearlyProjection, data } = useAppContext();
  const dailyTotal = data.dailyValueBento + data.dailyValueFernanda;
  
  return (
    <div className="p-4 rounded-lg border border-gray-200">
      <div className="flex items-center gap-2 mb-2">
        <DollarSign className="text-primary" size={18} />
        <h2 className="font-medium text-primary">Caixinha</h2>
      </div>
      
      <p className="text-sm mb-2">Depositado até agora</p>
      <p className="text-xl font-bold text-primary mb-4">{formatCurrency(totalSaved)}</p>
      
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-600 mb-1">Projeção mensal</p>
          <p className="font-bold text-sm">{formatCurrency(monthlyProjection)}</p>
        </div>
        
        <div className="flex-1 p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-gray-600 mb-1">Projeção anual</p>
          <p className="font-bold text-sm">{formatCurrency(yearlyProjection)}</p>
        </div>
      </div>
      
      <div className="mt-4 text-xs text-gray-500 flex items-center">
        <DollarSign size={14} className="inline mr-1" />
        <span>{formatCurrency(dailyTotal)} por dia</span>
      </div>
    </div>
  );
};

export default SavingsBox;
