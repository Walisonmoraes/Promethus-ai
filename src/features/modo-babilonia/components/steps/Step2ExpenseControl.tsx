import { useMemo, useState } from "react";
import { useBabilonia } from "../../BabiloniaContext";
import { SectionCard } from "../SectionCard";

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function Step2ExpenseControl() {
  const { state, addExpense, removeExpense } = useBabilonia();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number>(0);

  const totalExpenses = useMemo(
    () => state.expenses.reduce((sum, item) => sum + item.amount, 0),
    [state.expenses]
  );

  const usage = useMemo(() => {
    if (!state.monthlyIncome) return 0;
    return (totalExpenses / state.monthlyIncome) * 100;
  }, [state.monthlyIncome, totalExpenses]);

  const isAlert = usage >= 90;
  const sealIcon = (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M6 5h12M6 12h8M6 19h6M19 16v3M16 19h3" />
    </svg>
  );

  return (
    <SectionCard
      title="2. Controle de Gastos"
      description="Classifique despesas em necessidade ou desejo e controle o limite mensal."
      seal={{ icon: sealIcon, label: "Disciplina" }}
    >
      <div className="mb-row-form">
        <input
          className="mb-input"
          placeholder="Descricao da despesa"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <input
          className="mb-input"
          type="number"
          placeholder="Valor"
          value={amount || ""}
          onChange={(e) => setAmount(Number(e.target.value) || 0)}
        />
        <button
          className="mb-btn"
          onClick={() => {
            addExpense(description, amount);
            setDescription("");
            setAmount(0);
          }}
        >
          Adicionar
        </button>
      </div>

      <div className={`mb-note ${isAlert ? "mb-note--alert" : ""}`}>
        <p className="mb-note-title">Total no mes: {currency.format(totalExpenses)}</p>
        <p className="mb-note-text">
          Uso da renda: {usage.toFixed(1)}% {isAlert ? "(Alerta: acima de 90%)" : ""}
        </p>
      </div>

      <div className="mb-expense-list">
        {state.expenses.length === 0 ? (
          <p className="mb-empty">Nenhuma despesa cadastrada.</p>
        ) : (
          state.expenses.map((item) => (
            <div key={item.id} className="mb-expense-item">
              <div>
                <p>{item.description}</p>
                <p className={item.type === "Necessidade" ? "mb-badge mb-badge--need" : "mb-badge mb-badge--want"}>
                  {item.type}
                </p>
              </div>
              <div className="mb-expense-meta">
                <span>{currency.format(item.amount)}</span>
                <button className="mb-remove" onClick={() => removeExpense(item.id)}>
                  Remover
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </SectionCard>
  );
}
