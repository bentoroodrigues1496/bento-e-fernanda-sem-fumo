import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AppData, CheckIn, UserType, DailyCheckRecord } from "@/lib/types";
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

  // Transform Supabase records to our app data format
  const transformDailyChecks = (records: DailyCheckRecord[]): CheckIn[] => {
    // Group records by date
    const recordsByDate: Record<string, DailyCheckRecord[]> = {};
    
    records.forEach(record => {
      const dateKey = record.date;
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = [];
      }
      recordsByDate[dateKey].push(record);
    });
    
    // Transform grouped records into CheckIn format
    return Object.entries(recordsByDate).map(([date, dateRecords]) => {
      // Default check-in with both users unchecked
      const checkIn: CheckIn = {
        date,
        bento: false,
        fernanda: false,
        valueBento: data.dailyValueBento,
        valueFernanda: data.dailyValueFernanda
      };
      
      // Process each record for this date
      dateRecords.forEach(record => {
        // Determine which user the record belongs to based on user_id
        // In a real app, you would likely have a way to determine which user is "bento" and which is "fernanda"
        // For now, we'll use a more explicit flag in the record to indicate the user type
        
        if (record.completed) {
          // Check the user_id and determine if this is Bento or Fernanda
          // This is the key part that was causing the issue
          const recordEmail = record.user_id.toLowerCase();
          
          if (recordEmail.includes('bento')) {
            checkIn.bento = true;
            checkIn.valueBento = record.amount;
          } else {
            checkIn.fernanda = true;
            checkIn.valueFernanda = record.amount;
          }
        }
      });
      
      return checkIn;
    });
  };

  // Buscar dados iniciais do Supabase quando o componente for montado
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      
      try {
        console.log("Fetching initial data for user:", user.email);
        
        // Buscar os check-ins do usuário
        const { data: checkInsData, error: checkInsError } = await supabase
          .from('daily_checks')
          .select('*')
          .order('date', { ascending: false });
        
        if (checkInsError) throw checkInsError;
        
        console.log("Fetched check-ins data:", checkInsData);
        
        // Transform the data from Supabase to our app format
        const transformedCheckIns = transformDailyChecks(checkInsData);
        
        console.log("Transformed check-ins:", transformedCheckIns);
        
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
          table: 'daily_checks'
        },
        async (payload) => {
          console.log('Atualização em tempo real:', payload);
          
          // Atualizar o estado local com base na mudança
          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            
            // Buscar todos os dados atualizados para manter a sincronização
            const { data: checkInsData, error: checkInsError } = await supabase
              .from('daily_checks')
              .select('*')
              .order('date', { ascending: false });
              
            if (checkInsError) {
              console.error('Erro ao buscar dados atualizados:', checkInsError);
              return;
            }
            
            console.log("Dados atualizados recebidos:", checkInsData);
            
            // Transform the data to our app format
            const transformedCheckIns = transformDailyChecks(checkInsData);
            
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
  const updateCheckIn = async (userType: UserType) => {
    if (!session || !user) {
      toast.error('Você precisa estar logado para fazer check-in');
      return;
    }
    
    // Determinar qual usuário está fazendo o check-in
    const isUserBento = user.email?.toLowerCase().includes('bento');
    const isUserFernanda = user.email?.toLowerCase().includes('fernanda');
    
    // Verificar se o usuário está tentando fazer check-in para o usuário correto
    if ((userType === 'bento' && !isUserBento) || (userType === 'fernanda' && !isUserFernanda)) {
      toast.error(`Você só pode marcar check-in como ${isUserBento ? 'Bento' : 'Fernanda'}`);
      return;
    }
    
    const today = startOfDay(new Date());
    const todayISO = formatISO(today);
    
    console.log(`Atualizando check-in para ${userType}. User ID: ${user.id}, Email: ${user.email}`);

    try {
      // Verificar se já existe um check-in para hoje
      const { data: existingCheck, error: checkError } = await supabase
        .from('daily_checks')
        .select('*')
        .eq('date', todayISO)
        .eq('user_id', user.id)
        .single();
        
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let newCheckInValue = true;
      
      // Se já existe um check-in para hoje, alternar o valor
      if (existingCheck) {
        newCheckInValue = !existingCheck.completed;
        console.log(`Check existente encontrado. Alternando de ${existingCheck.completed} para ${newCheckInValue}`);
      } else {
        console.log('Nenhum check existente para hoje. Criando novo check-in.');
      }
      
      // Atualizar estado local otimisticamente
      setData(prevData => {
        const existingCheckInIndex = prevData.checkIns.findIndex(
          checkIn => isSameDay(parseISO(checkIn.date), today)
        );
        
        const updatedCheckIns = [...prevData.checkIns];
        
        if (existingCheckInIndex >= 0) {
          updatedCheckIns[existingCheckInIndex] = {
            ...updatedCheckIns[existingCheckInIndex],
            [userType]: newCheckInValue
          };
        } else {
          updatedCheckIns.unshift({
            date: todayISO,
            bento: userType === 'bento' ? true : false,
            fernanda: userType === 'fernanda' ? true : false,
            valueBento: userType === 'bento' ? prevData.dailyValueBento : 0,
            valueFernanda: userType === 'fernanda' ? prevData.dailyValueFernanda : 0
          });
        }
        
        return {
          ...prevData,
          checkIns: updatedCheckIns
        };
      });
      
      // Get the amount value for the current user type
      const amount = data[`dailyValue${userType.charAt(0).toUpperCase() + userType.slice(1)}`];
      
      console.log(`Salvando no Supabase. UserID: ${user.id}, Completed: ${newCheckInValue}, Amount: ${amount}`);
      
      // Salvar no Supabase
      const { error } = await supabase
        .from('daily_checks')
        .upsert({
          date: todayISO,
          user_id: user.id,
          completed: newCheckInValue,
          amount
        });
      
      if (error) throw error;
      
      console.log('Check-in atualizado com sucesso');
      
    } catch (error) {
      console.error('Erro ao atualizar check-in:', error);
      toast.error('Erro ao salvar check-in');
      
      // Reverter alteração local em caso de erro
      const { data: checkInsData } = await supabase
        .from('daily_checks')
        .select('*')
        .order('date', { ascending: false });
      
      if (checkInsData) {
        const transformedCheckIns = transformDailyChecks(checkInsData);
        
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
