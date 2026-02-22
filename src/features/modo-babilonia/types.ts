export type StageStatus = "Bloqueado" | "Em Progresso" | "Concluido";

export type ExpenseType = "Necessidade" | "Desejo";

export type BabiloniaStage = {
  id: number;
  title: string;
  status: StageStatus;
};

export type ExpenseItem = {
  id: string;
  description: string;
  amount: number;
  type: ExpenseType;
};

export type BabiloniaState = {
  monthlyIncome: number;
  currentSavings: number;
  savedMonthsConsistency: number;

  expenses: ExpenseItem[];

  investedAmount: number;
  annualRate: number;
  investmentMonths: number;

  emergencyReserve: number;

  propertyValue: number;
  downPaymentTarget: number;
  housingDeadlineMonths: number;

  currentAge: number;
  targetAge: number;
  desiredFutureIncome: number;

  skills: string;
  futureIncomeGoal: number;
};

export type BabiloniaLevel =
  | "Iniciante"
  | "Construtor"
  | "Investidor"
  | "Arquiteto da Riqueza";
