
import React from 'react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';

const StatCards: React.FC = () => {
  const { totalSaved, consecutiveDays } = useAppContext();

  return (
    <div className="flex gap-3 mb-4">
      <div className="flex-1 p-4 rounded-lg bg-mint">
        <p className="text-sm text-gray-700">Total na Caixinha</p>
        <p className="text-xl font-bold text-mint-dark">{formatCurrency(totalSaved)}</p>
      </div>
      <div className="flex-1 p-4 rounded-lg bg-blue-light">
        <p className="text-sm text-gray-700">Dias Consecutivos</p>
        <p className="text-xl font-bold text-blue-dark">{consecutiveDays} dias</p>
      </div>
    </div>
  );
};

export default StatCards;
