
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAppContext } from '@/context/AppContext';
import { Check } from 'lucide-react';

const WeeklyProgress: React.FC = () => {
  const { weeklyProgress, weekDays } = useAppContext();
  const [showCurrentWeek, setShowCurrentWeek] = useState(true);
  
  // Poderia adicionar lógica para semanas anteriores aqui
  
  return (
    <div className="p-4 mb-4 rounded-lg border border-gray-200">
      <h2 className="font-medium mb-4">Progresso Semanal</h2>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm">Bento</span>
          <span className="text-xs">{Math.round(weeklyProgress.bento)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-mint-dark" 
            style={{ width: `${weeklyProgress.bento}%` }}
          />
        </div>
      </div>
      
      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm">Fernanda</span>
          <span className="text-xs">{Math.round(weeklyProgress.fernanda)}%</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-blue-dark" 
            style={{ width: `${weeklyProgress.fernanda}%` }}
          />
        </div>
      </div>
      
      <div className="flex mb-2">
        <button 
          className={`flex-1 py-2 text-center text-sm ${showCurrentWeek ? 'font-medium' : ''}`}
          onClick={() => setShowCurrentWeek(true)}
        >
          Esta semana
        </button>
        <button 
          className={`flex-1 py-2 text-center text-sm ${!showCurrentWeek ? 'font-medium' : ''}`}
          onClick={() => setShowCurrentWeek(false)}
        >
          Semana anterior
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mt-2">
        {weekDays.map((day, index) => (
          <div key={index} className="flex flex-col items-center">
            <span className="text-xs text-gray-500">
              {format(day.date, 'EEE', { locale: ptBR }).substring(0, 3)}
            </span>
            <span className="text-xs mb-1">{format(day.date, 'dd')}</span>
            
            <div className="flex flex-col gap-1">
              <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100">
                {day.bentoChecked && <Check size={12} className="text-mint-dark" />}
                {!day.bentoChecked && <span className="text-xs text-gray-400">x</span>}
              </div>
              
              <div className="w-5 h-5 flex items-center justify-center rounded-full bg-gray-100">
                {day.fernandaChecked && <Check size={12} className="text-blue-dark" />}
                {!day.fernandaChecked && <span className="text-xs text-gray-400">x</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyProgress;
