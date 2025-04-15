
import React from 'react';
import { AppProvider } from '@/context/AppContext';
import Header from '@/components/Header';
import StatCards from '@/components/StatCards';
import DailyCheckIn from '@/components/DailyCheckIn';
import WeeklyProgress from '@/components/WeeklyProgress';
import SavingsBox from '@/components/SavingsBox';

const Index: React.FC = () => {
  return (
    <AppProvider>
      <div className="max-w-md mx-auto p-4 min-h-screen">
        <Header />
        <StatCards />
        <DailyCheckIn />
        <WeeklyProgress />
        <SavingsBox />
      </div>
    </AppProvider>
  );
};

export default Index;
