import {
  BabiloniaLevel,
  BabiloniaStage,
  BabiloniaState,
  ExpenseType,
  StageStatus,
} from "./types";

const STAGE_TITLES = [
  "Pague-se Primeiro",
  "Controle de Gastos",
  "Dinheiro Trabalhando",
  "Protecao Financeira",
  "Moradia Inteligente",
  "Futuro Financeiro",
  "Aumento de Renda",
];

export function clamp(value: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, value));
}

export function classifyExpense(description: string): ExpenseType {
  const text = description.toLowerCase();
  const needKeywords = [
    "aluguel",
    "luz",
    "agua",
    "internet",
    "mercado",
    "farmacia",
    "transporte",
    "saude",
    "escola",
  ];
  return needKeywords.some((keyword) => text.includes(keyword))
    ? "Necessidade"
    : "Desejo";
}

export function getRecommendedSavings(income: number) {
  return income * 0.1;
}

export function getSavingsConsistency(income: number, currentSavings: number) {
  const recommended = getRecommendedSavings(income);
  if (recommended <= 0) return 0;
  return clamp((currentSavings / recommended) * 100);
}

export function getMonthlySavingsProjection(monthlySave: number, months = 12) {
  const monthlyRate = 0.003;
  const series = [] as { month: string; total: number }[];
  let total = 0;

  for (let i = 1; i <= months; i += 1) {
    total = total * (1 + monthlyRate) + monthlySave;
    series.push({ month: `Mes ${i}`, total: Number(total.toFixed(2)) });
  }

  return series;
}

export function getCompoundInterestSeries(
  investedAmount: number,
  annualRate: number,
  months: number
) {
  const monthlyRate = annualRate > 0 ? annualRate / 100 / 12 : 0;
  const normalizedMonths = Math.max(1, Math.floor(months || 1));
  const series = [] as { period: string; total: number }[];

  for (let i = 1; i <= normalizedMonths; i += 1) {
    const total = investedAmount * Math.pow(1 + monthlyRate, i);
    series.push({ period: `M${i}`, total: Number(total.toFixed(2)) });
  }

  return series;
}

export function getEmergencyReserveMonths(reserve: number, income: number) {
  if (income <= 0) return 0;
  return reserve / income;
}

export function getEmergencyReserveColor(monthsCovered: number) {
  if (monthsCovered >= 6) return "green";
  if (monthsCovered >= 3) return "yellow";
  return "red";
}

export function getEntryTimeEstimate(
  downPaymentTarget: number,
  currentSavings: number,
  monthlySavingsCapacity: number
) {
  const missing = Math.max(0, downPaymentTarget - currentSavings);
  if (missing === 0) return 0;
  if (monthlySavingsCapacity <= 0) return Number.POSITIVE_INFINITY;
  return Math.ceil(missing / monthlySavingsCapacity);
}

export function getFuturePatrimonyTarget(desiredFutureIncome: number) {
  const annualRealYield = 0.04;
  const yearlyIncomeNeeded = desiredFutureIncome * 12;
  if (yearlyIncomeNeeded <= 0) return 0;
  return yearlyIncomeNeeded / annualRealYield;
}

export function getIncomeGrowthPlan(skills: string, current: number, goal: number) {
  const parsedSkills = skills
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  return [
    `Mapear lacunas entre renda atual (R$ ${current.toFixed(2)}) e meta (R$ ${goal.toFixed(2)}).`,
    parsedSkills.length
      ? `Alavancar habilidades: ${parsedSkills.slice(0, 3).join(", ")} em projetos com monetizacao direta.`
      : "Escolher 2 habilidades de alto valor para aprofundamento e portfolio.",
    "Executar ciclos quinzenais: estudo, entrega publica e oferta de servicos/produtos.",
  ];
}

export function getStageCompletion(state: BabiloniaState) {
  const expensesTotal = state.expenses.reduce((sum, item) => sum + item.amount, 0);
  const reserveMonths = getEmergencyReserveMonths(state.emergencyReserve, state.monthlyIncome);

  return [
    state.monthlyIncome > 0 && state.currentSavings > 0,
    state.expenses.length > 0 && state.monthlyIncome > 0 && expensesTotal <= state.monthlyIncome,
    state.investedAmount > 0 && state.annualRate > 0 && state.investmentMonths > 0,
    reserveMonths >= 6,
    state.propertyValue > 0 && state.downPaymentTarget > 0 && state.housingDeadlineMonths > 0,
    state.currentAge > 0 &&
      state.targetAge > state.currentAge &&
      state.desiredFutureIncome > 0,
    state.skills.trim().length > 0 && state.futureIncomeGoal > state.monthlyIncome,
  ];
}

export function getStages(state: BabiloniaState): BabiloniaStage[] {
  const completion = getStageCompletion(state);

  return STAGE_TITLES.map((title, index) => {
    const isCompleted = completion[index];
    const hasPreviousPending = completion.slice(0, index).some((value) => !value);

    let status: StageStatus = "Bloqueado";
    if (isCompleted) status = "Concluido";
    else if (!hasPreviousPending) status = "Em Progresso";

    return {
      id: index + 1,
      title,
      status,
    };
  });
}

export function getBabiloniaScore(state: BabiloniaState) {
  const savePercent = getSavingsConsistency(state.monthlyIncome, state.currentSavings);
  const reserveProgress = clamp(
    (state.emergencyReserve / Math.max(1, state.monthlyIncome * 6)) * 100
  );
  const investmentProgress = state.investedAmount > 0 ? 100 : 0;

  return Math.round(savePercent * 0.4 + reserveProgress * 0.4 + investmentProgress * 0.2);
}

export function getBabiloniaLevel(score: number): BabiloniaLevel {
  if (score >= 75) return "Arquiteto da Riqueza";
  if (score >= 50) return "Investidor";
  if (score >= 25) return "Construtor";
  return "Iniciante";
}

export function getOverallProgress(state: BabiloniaState) {
  const completion = getStageCompletion(state);
  const completed = completion.filter(Boolean).length;
  return Math.round((completed / completion.length) * 100);
}
