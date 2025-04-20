
export type CheckIn = {
  date: string;
  bento: boolean;
  fernanda: boolean;
  valueBento: number;
  valueFernanda: number;
};

export type AppData = {
  checkIns: CheckIn[];
  dailyValueBento: number;
  dailyValueFernanda: number;
};

export type UserType = 'bento' | 'fernanda';

// Type for the database records from Supabase
export type DailyCheckRecord = {
  id: string;
  user_id: string;
  date: string;
  completed: boolean;
  amount: number;
  created_at: string;
  updated_at: string;
};
