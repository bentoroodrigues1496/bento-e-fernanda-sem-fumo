
import React from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

const DailyCheckIn: React.FC = () => {
  const { updateCheckIn, data, todayCheckIn } = useAppContext();
  const { user } = useAuth();
  const today = new Date();
  
  const isUserBento = user?.email?.toLowerCase().includes('bento');
  const isUserFernanda = user?.email?.toLowerCase().includes('fernanda');
  
  return (
    <div className="p-4 mb-4 rounded-lg border border-gray-200">
      <h2 className="text-center font-medium mb-2">Check-in de Hoje</h2>
      <p className="text-center text-sm text-gray-500 mb-4">
        {format(today, "dd 'de' MMMM", { locale: ptBR })}
      </p>
      
      <div className="flex justify-between">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Bento</span>
          <button
            onClick={() => updateCheckIn('bento')}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              todayCheckIn?.bento ? 'bg-mint' : 'bg-gray-100'
            } ${!isUserBento ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isUserBento}
          >
            <Clock size={18} className={todayCheckIn?.bento ? 'text-mint-dark' : 'text-gray-400'} />
          </button>
          <span className="mt-2 text-sm">{formatCurrency(data.dailyValueBento)}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Fernanda</span>
          <button
            onClick={() => updateCheckIn('fernanda')}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              todayCheckIn?.fernanda ? 'bg-blue-light' : 'bg-gray-100'
            } ${!isUserFernanda ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isUserFernanda}
          >
            <Clock size={18} className={todayCheckIn?.fernanda ? 'text-blue-dark' : 'text-gray-400'} />
          </button>
          <span className="mt-2 text-sm">{formatCurrency(data.dailyValueFernanda)}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;
