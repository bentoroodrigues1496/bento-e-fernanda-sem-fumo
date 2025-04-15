
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
