
import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppData, CheckIn, UserType } from "@/lib/types";
import { formatISO, parseISO, startOfDay, isSameDay, addDays, differenceInDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useAuth } from "./AuthContext";
import { toast } from "sonner";

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
  const { session, user } = useAuth();

  // Buscar dados iniciais do Supabase quando o componente for montado
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      try {
        // Buscar os check-ins do usuário
        const { data: checkInsData, error: checkInsError } = await supabase
          .from('daily_checks')
          .select('*')
          .order('date', { ascending: false });
        
        if (checkInsError) throw checkInsError;
        
        // Transformar os dados do Supabase para o formato do app
        const transformedCheckIns: CheckIn[] = checkInsData.map(item => ({
          date: item.date,
          bento: item.bento || false,
          fernanda: item.fernanda || false,
          valueBento: item.valueBento || data.dailyValueBento,
          valueFernanda: item.valueFernanda || data.dailyValueFernanda
        }));
        
        setData(prevData => ({
          ...prevData,
          checkIns: transformedCheckIns
        }));
        
      } catch (error) {
        console.error('Erro ao buscar dados:', error);
        toast.error('Erro ao carregar dados');
      }
    };

    fetchInitialData();
    
    // Configurar listener para mudanças em tempo real
    const channel = supabase
      .channel('daily-checks-changes')
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'daily_checks',
          filter: user ? `user_id=eq.${user.id}` : undefined
        },
        async (payload) => {
          console.log('Atualização em tempo real:', payload);
          
          // Atualizar o estado local com base na mudança
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const newItem = payload.new as any;
            
            // Buscar todos os dados atualizados para manter a sincronização
            const { data: checkInsData, error: checkInsError } = await supabase
              .from('daily_checks')
              .select('*')
              .order('date', { ascending: false });
              
            if (checkInsError) {
              console.error('Erro ao buscar dados atualizados:', checkInsError);
              return;
            }
            
            // Transformar os dados do Supabase para o formato do app
            const transformedCheckIns: CheckIn[] = checkInsData.map(item => ({
              date: item.date,
              bento: item.bento || false,
              fernanda: item.fernanda || false,
              valueBento: item.valueBento || data.dailyValueBento,
              valueFernanda: item.valueFernanda || data.dailyValueFernanda
            }));
            
            setData(prevData => ({
              ...prevData,
              checkIns: transformedCheckIns
            }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Atualizar check-in e salvar no Supabase
  const updateCheckIn = async (user: UserType) => {
    if (!session) {
      toast.error('Você precisa estar logado para fazer check-in');
      return;
    }
    
    const today = startOfDay(new Date());
    const todayISO = formatISO(today);

    try {
      // Verificar se já existe um check-in para hoje
      const existingCheckInIndex = data.checkIns.findIndex(
        checkIn => isSameDay(parseISO(checkIn.date), today)
      );
      
      const updatedCheckIns = [...data.checkIns];
      let newCheckInValue = true;
      
      // Se já existe, alternar o valor
      if (existingCheckInIndex >= 0) {
        newCheckInValue = !updatedCheckIns[existingCheckInIndex][user];
        updatedCheckIns[existingCheckInIndex] = {
          ...updatedCheckIns[existingCheckInIndex],
          [user]: newCheckInValue
        };
      } else {
        // Se não existe, criar um novo
        updatedCheckIns.unshift({
          date: todayISO,
          bento: user === 'bento',
          fernanda: user === 'fernanda',
          valueBento: user === 'bento' ? data.dailyValueBento : 0,
          valueFernanda: user === 'fernanda' ? data.dailyValueFernanda : 0
        });
      }
      
      // Atualizar estado local otimisticamente
      setData(prevData => ({
        ...prevData,
        checkIns: updatedCheckIns
      }));
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('daily_checks')
        .upsert({
          date: todayISO,
          user_id: user?.id,
          [user]: newCheckInValue,
          [`value${user.charAt(0).toUpperCase() + user.slice(1)}`]: 
            data[`dailyValue${user.charAt(0).toUpperCase() + user.slice(1)}`]
        });
      
      if (error) throw error;
      
    } catch (error) {
      console.error('Erro ao atualizar check-in:', error);
      toast.error('Erro ao salvar check-in');
      
      // Reverter alteração local em caso de erro
      const { data: checkInsData } = await supabase
        .from('daily_checks')
        .select('*')
        .order('date', { ascending: false });
      
      if (checkInsData) {
        const transformedCheckIns: CheckIn[] = checkInsData.map(item => ({
          date: item.date,
          bento: item.bento || false,
          fernanda: item.fernanda || false,
          valueBento: item.valueBento || data.dailyValueBento,
          valueFernanda: item.valueFernanda || data.dailyValueFernanda
        }));
        
        setData(prevData => ({
          ...prevData,
          checkIns: transformedCheckIns
        }));
      }
    }
  };

  // Atualizar valor diário
  const updateDailyValue = async (userType: UserType, value: number) => {
    try {
      setData(prevData => ({
        ...prevData,
        [`dailyValue${userType.charAt(0).toUpperCase() + userType.slice(1)}`]: value
      }));
      
      // TODO: Implementar atualização do valor diário no Supabase
    } catch (error) {
      console.error('Erro ao atualizar valor diário:', error);
      toast.error('Erro ao atualizar valor');
    }
  };

  // Calcular o check-in de hoje
  const calculateTodayCheckIn = (): CheckIn | null => {
    const today = startOfDay(new Date());
    const todayCheckIn = data.checkIns.find(checkIn => 
      isSameDay(parseISO(checkIn.date), today)
    );
    return todayCheckIn || null;
  };

  // Calcular dias consecutivos sem fumar (ambos marcados)
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
  
  const todayCheckIn = calculateTodayCheckIn();
  const { monthlyProjection, yearlyProjection } = calculateProjections();
  const consecutiveDays = calculateConsecutiveDays();
  const totalSaved = calculateTotalSaved();
  const weeklyProgress = calculateWeeklyProgress();
  const weekDays = getWeekDays();
  
  return (
    <AppContext.Provider
      value={{
        data,
        todayCheckIn,
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
