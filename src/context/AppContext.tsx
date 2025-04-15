
import React, { createContext, useContext, useEffect, useState } from "react";
import { AppData, CheckIn, UserType } from "@/lib/types";
import { formatISO, parseISO, startOfDay, format, addDays, isSameDay, differenceInDays, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

// Chave para o localStorage
const LOCAL_STORAGE_KEY = "sem-fumar-data";

// Valores iniciais
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
  
  // Carregar dados do localStorage na inicialização
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        setData(JSON.parse(savedData));
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
    }
    
    // Configurar intervalo para verificar atualizações a cada 30 segundos
    const intervalId = setInterval(() => {
      const latestData = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (latestData) {
        try {
          const parsedData = JSON.parse(latestData);
          // Só atualiza se os dados forem diferentes
          if (JSON.stringify(parsedData) !== JSON.stringify(data)) {
            setData(parsedData);
          }
        } catch (e) {
          console.error("Erro ao sincronizar dados:", e);
        }
      }
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, []);
  
  // Salvar dados para o localStorage sempre que houver mudanças
  useEffect(() => {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  }, [data]);
  
  // Obter check-in de hoje ou criar um novo se não existir
  const todayDate = startOfDay(new Date());
  const todayISODate = formatISO(todayDate);
  
  const todayCheckIn = data.checkIns.find(checkIn => 
    isSameDay(parseISO(checkIn.date), todayDate)
  ) || null;
  
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
  
  // Atualizar check-in
  const updateCheckIn = (user: UserType) => {
    const today = startOfDay(new Date());
    const todayISO = formatISO(today);
    
    setData(prevData => {
      // Verificar se já existe um check-in para hoje
      const existingCheckInIndex = prevData.checkIns.findIndex(
        checkIn => isSameDay(parseISO(checkIn.date), today)
      );
      
      const updatedCheckIns = [...prevData.checkIns];
      
      if (existingCheckInIndex >= 0) {
        // Atualizar check-in existente
        updatedCheckIns[existingCheckInIndex] = {
          ...updatedCheckIns[existingCheckInIndex],
          [user]: !updatedCheckIns[existingCheckInIndex][user],
          [`value${user.charAt(0).toUpperCase() + user.slice(1)}`]: prevData[`dailyValue${user.charAt(0).toUpperCase() + user.slice(1)}` as keyof AppData]
        };
      } else {
        // Criar novo check-in
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
  };
  
  // Atualizar valor diário
  const updateDailyValue = (user: UserType, value: number) => {
    setData(prevData => ({
      ...prevData,
      [`dailyValue${user.charAt(0).toUpperCase() + user.slice(1)}`]: value
    }));
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
