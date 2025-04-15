
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { PiggyBank, Calendar } from 'lucide-react';

const StatCards: React.FC = () => {
  const { totalSaved, consecutiveDays } = useAppContext();

  return (
    <div className="flex gap-3 mb-5">
      <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-mint to-mint/50 shadow-sm border border-mint-dark/10">
        <div className="flex items-center mb-2">
          <PiggyBank className="w-5 h-5 mr-2 text-mint-dark" />
          <p className="text-sm text-mint-dark font-medium">Total na Caixinha</p>
        </div>
        <p className="text-xl font-bold text-mint-dark">{formatCurrency(totalSaved)}</p>
      </div>
      <div className="flex-1 p-4 rounded-2xl bg-gradient-to-br from-blue-light to-blue-light/50 shadow-sm border border-blue-dark/10">
        <div className="flex items-center mb-2">
          <Calendar className="w-5 h-5 mr-2 text-blue-dark" />
          <p className="text-sm text-blue-dark font-medium">Dias Consecutivos</p>
        </div>
        <p className="text-xl font-bold text-blue-dark">{consecutiveDays} dias</p>
      </div>
    </div>
  );
};

export default StatCards;
