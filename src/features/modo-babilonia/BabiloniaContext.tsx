"use client";

import React, { createContext, useContext, useMemo, useState } from "react";
import { BabiloniaState, ExpenseItem } from "./types";
import { classifyExpense } from "./utils";

type BabiloniaContextValue = {
  state: BabiloniaState;
  updateField: <K extends keyof BabiloniaState>(key: K, value: BabiloniaState[K]) => void;
  addExpense: (description: string, amount: number) => void;
  removeExpense: (id: string) => void;
};

const initialState: BabiloniaState = {
  monthlyIncome: 0,
  currentSavings: 0,
  savedMonthsConsistency: 0,

  expenses: [],

  investedAmount: 0,
  annualRate: 10,
  investmentMonths: 24,

  emergencyReserve: 0,

  propertyValue: 0,
  downPaymentTarget: 0,
  housingDeadlineMonths: 24,

  currentAge: 30,
  targetAge: 60,
  desiredFutureIncome: 10000,

  skills: "",
  futureIncomeGoal: 0,
};

const BabiloniaContext = createContext<BabiloniaContextValue | null>(null);

export function BabiloniaProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<BabiloniaState>(initialState);

  const updateField = <K extends keyof BabiloniaState>(key: K, value: BabiloniaState[K]) => {
    setState((prev) => ({ ...prev, [key]: value }));
  };

  const addExpense = (description: string, amount: number) => {
    const trimmedDescription = description.trim();
    if (!trimmedDescription || amount <= 0) return;

    const nextExpense: ExpenseItem = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      description: trimmedDescription,
      amount,
      type: classifyExpense(trimmedDescription),
    };

    setState((prev) => ({
      ...prev,
      expenses: [nextExpense, ...prev.expenses],
    }));
  };

  const removeExpense = (id: string) => {
    setState((prev) => ({
      ...prev,
      expenses: prev.expenses.filter((item) => item.id !== id),
    }));
  };

  // Memoized to avoid re-rendering consumers when handlers identity does not change.
  const value = useMemo(
    () => ({ state, updateField, addExpense, removeExpense }),
    [state]
  );

  return <BabiloniaContext.Provider value={value}>{children}</BabiloniaContext.Provider>;
}

export function useBabilonia() {
  const context = useContext(BabiloniaContext);
  if (!context) {
    throw new Error("useBabilonia must be used inside BabiloniaProvider");
  }
  return context;
}
