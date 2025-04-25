
import React, { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Clock, Calendar as CalendarIcon } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const DailyCheckIn: React.FC = () => {
  const { updateCheckIn, data, todayCheckIn } = useAppContext();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  const isUserBento = user?.email?.toLowerCase().includes('bento');
  const isUserFernanda = user?.email?.toLowerCase().includes('fernanda');
  
  return (
    <div className="p-4 mb-4 rounded-lg border border-gray-200">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium">Check-in</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <CalendarIcon className="h-4 w-4" />
              {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              initialFocus
              locale={ptBR}
              disabled={{ after: new Date() }}
            />
          </PopoverContent>
        </Popover>
      </div>
      
      <div className="flex justify-between">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Bento</span>
          <button
            onClick={() => updateCheckIn('bento', selectedDate)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              data.checkIns.find(checkIn => 
                format(new Date(checkIn.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              )?.bento ? 'bg-mint' : 'bg-gray-100'
            } ${!isUserBento ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isUserBento}
            title={!isUserBento ? 'Apenas Bento pode marcar este check-in' : ''}
          >
            <Clock size={18} className={data.checkIns.find(checkIn => 
              format(new Date(checkIn.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            )?.bento ? 'text-mint-dark' : 'text-gray-400'} />
          </button>
          <span className="mt-2 text-sm">{formatCurrency(data.dailyValueBento)}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Fernanda</span>
          <button
            onClick={() => updateCheckIn('fernanda', selectedDate)}
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              data.checkIns.find(checkIn => 
                format(new Date(checkIn.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
              )?.fernanda ? 'bg-blue-light' : 'bg-gray-100'
            } ${!isUserFernanda ? 'opacity-50 cursor-not-allowed' : ''}`}
            disabled={!isUserFernanda}
            title={!isUserFernanda ? 'Apenas Fernanda pode marcar este check-in' : ''}
          >
            <Clock size={18} className={data.checkIns.find(checkIn => 
              format(new Date(checkIn.date), 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd')
            )?.fernanda ? 'text-blue-dark' : 'text-gray-400'} />
          </button>
          <span className="mt-2 text-sm">{formatCurrency(data.dailyValueFernanda)}</span>
        </div>
      </div>
    </div>
  );
};

export default DailyCheckIn;
