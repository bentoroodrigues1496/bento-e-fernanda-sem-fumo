
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
      <div className="min-h-screen px-4 py-6 bg-gradient-to-br from-white via-blue-light/20 to-mint/30">
        <div className="max-w-md mx-auto rounded-2xl bg-white/50 backdrop-blur-sm shadow-lg border border-white/50 p-5">
          <Header />
          <StatCards />
          <DailyCheckIn />
          <WeeklyProgress />
          <SavingsBox />
        </div>
      </div>
    </AppProvider>
  );
};

export default Index;
