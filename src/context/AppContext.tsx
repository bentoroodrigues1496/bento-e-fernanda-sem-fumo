import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppData, CheckIn, UserType } from "@/lib/types";
import { formatISO, parseISO, startOfDay, isSameDay, format, addDays, differenceInDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

// Chave para o localStorage
const LOCAL_STORAGE_KEY = "sem-fumar-data";

const initialData: AppData = {
  checkIns: [],
  dailyValueBento: 20.00,
  dailyValueFernanda: 20.00,
};

type AppContextType = {
  data: AppData;
  todayCheckIn: CheckIn | null;
  updateCheckIn: (user: UserType) => void;
  updateDailyValue: (user: UserType, value: number) => void;
  consecutiveDays: number;
  totalSaved: number;
  weeklyProgress: { bento: number; fernanda: number };
  weekDays: { date: Date; bentoChecked: boolean; fernandaChecked: boolean }[];
  monthlyProjection: number;
  yearlyProjection: number;
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<AppData>(initialData);
  const [session, setSession] = useState(null);

  // Fetch initial data from Supabase on component mount
  useEffect(() => {
    const fetchInitialData = async () => {
      // TODO: Implement user-specific data fetching
      // This will require authentication to be set up
    };

    // Set up real-time listener for changes
    const channel = supabase
      .channel('app-data-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'daily_checks' 
        },
        (payload) => {
          // Handle real-time updates
          console.log('Real-time update:', payload);
          // Update local state based on payload
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Update check-in method to save to Supabase
  const updateCheckIn = async (user: UserType) => {
    const today = startOfDay(new Date());
    const todayISO = formatISO(today);

    try {
      // Insert or update check-in in Supabase
      const { data: checkInData, error } = await supabase
        .from('daily_checks')
        .upsert({
          date: todayISO,
          user_id: session?.user?.id, // Require authentication
          [user]: true,
          [`value${user.charAt(0).toUpperCase() + user.slice(1)}`]: 
            data[`dailyValue${user.charAt(0).toUpperCase() + user.slice(1)}`]
        })
        .select();

      if (error) throw error;

      // Update local state optimistically
      setData(prevData => {
        const updatedCheckIns = [...prevData.checkIns];
        const existingCheckInIndex = updatedCheckIns.findIndex(
          checkIn => isSameDay(parseISO(checkIn.date), today)
        );

        if (existingCheckInIndex >= 0) {
          updatedCheckIns[existingCheckInIndex] = {
            ...updatedCheckIns[existingCheckInIndex],
            [user]: !updatedCheckIns[existingCheckInIndex][user]
          };
        } else {
          updatedCheckIns.push({
            date: todayISO,
            bento: user === 'bento',
            fernanda: user === 'fernanda',
            valueBento: user === 'bento' ? prevData.dailyValueBento : 0,
            valueFernanda: user === 'fernanda' ? prevData.dailyValueFernanda : 0
          });
        }

        return {
          ...prevData,
          checkIns: updatedCheckIns
        };
      });
    } catch (error) {
      console.error('Error updating check-in:', error);
    }
  };

  // Update daily value method to save to Supabase
  const updateDailyValue = async (user: UserType, value: number) => {
    try {
      // TODO: Implement updating daily value in Supabase
      setData(prevData => ({
        ...prevData,
        [`dailyValue${user.charAt(0).toUpperCase() + user.slice(1)}`]: value
      }));
    } catch (error) {
      console.error('Error updating daily value:', error);
    }
  };

  // Dias consecutivos sem fumar (ambos marcados)
  const calculateConsecutiveDays = (): number => {
    const sortedCheckIns = [...data.checkIns]
      .sort((a, b) => parseISO(b.date).getTime() - parseISO(a.date).getTime());
    
    let count = 0;
    
    for (let i = 0; i < sortedCheckIns.length; i++) {
      const currentDate = parseISO(sortedCheckIns[i].date);
      
      // Se não for consecutivo ao dia anterior ou ambos não marcaram, quebra a sequência
      if (
        i > 0 && 
        differenceInDays(currentDate, parseISO(sortedCheckIns[i-1].date)) !== -1 ||
        !sortedCheckIns[i].bento || 
        !sortedCheckIns[i].fernanda
      ) {
        break;
      }
      
      count++;
    }
    
    return count;
  };
  
  // Total economizado
  const calculateTotalSaved = (): number => {
    return data.checkIns.reduce((total, checkIn) => {
      let dayTotal = 0;
      if (checkIn.bento) dayTotal += checkIn.valueBento || data.dailyValueBento;
      if (checkIn.fernanda) dayTotal += checkIn.valueFernanda || data.dailyValueFernanda;
      return total + dayTotal;
    }, 0);
  };
  
  // Criar array com os dias da semana atual
  const getWeekDays = () => {
    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { locale: ptBR });
    
    return Array.from({ length: 7 }).map((_, index) => {
      const date = addDays(startOfCurrentWeek, index);
      const dayCheckIn = data.checkIns.find(checkIn => 
        isSameDay(parseISO(checkIn.date), date)
      );
      
      return {
        date,
        bentoChecked: dayCheckIn?.bento || false,
        fernandaChecked: dayCheckIn?.fernanda || false
      };
    });
  };
  
  // Cálculo do progresso semanal
  const calculateWeeklyProgress = () => {
    const weekDays = getWeekDays();
    const bentoCheckedDays = weekDays.filter(day => day.bentoChecked).length;
    const fernandaCheckedDays = weekDays.filter(day => day.fernandaChecked).length;
    
    return {
      bento: (bentoCheckedDays / 7) * 100,
      fernanda: (fernandaCheckedDays / 7) * 100
    };
  };
  
  // Calcular projeções
  const calculateProjections = () => {
    const dailyTotal = data.dailyValueBento + data.dailyValueFernanda;
    const monthlyProjection = dailyTotal * 30;
    const yearlyProjection = dailyTotal * 365;
    
    return { monthlyProjection, yearlyProjection };
  };
  
  const { monthlyProjection, yearlyProjection } = calculateProjections();
  const consecutiveDays = calculateConsecutiveDays();
  const totalSaved = calculateTotalSaved();
  const weeklyProgress = calculateWeeklyProgress();
  const weekDays = getWeekDays();
  
  return (
    <AppContext.Provider
      value={{
        data,
        todayCheckIn: null, // TODO: Implement todayCheckIn from Supabase data
        updateCheckIn,
        updateDailyValue,
        consecutiveDays,
        totalSaved,
        weeklyProgress,
        weekDays,
        monthlyProjection,
        yearlyProjection
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
};
