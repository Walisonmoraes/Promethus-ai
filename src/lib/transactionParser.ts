// Funções para extrair informações de texto de transação

/**
 * Extrai valor monetário de um texto
 * Suporta formatos: R$ 10,99, 10.99, 10,99, 10.99 reais, etc.
 */
export function extractAmount(text: string): number | null {
  const cleanText = text.trim().toLowerCase();

  const naturalMatch = cleanText.match(/(\d+(?:[\.,]\d+)?)\s*(milh(?:a|ã)o|milhoes|milhões|mil)\b/);
  if (naturalMatch) {
    const base = parseFloat(naturalMatch[1].replace(".", "").replace(",", "."));
    if (isNaN(base) || base <= 0) return null;
    return naturalMatch[2].startsWith("milh") ? base * 1000000 : base * 1000;
  }

  const match = cleanText.match(/r\$\s*(\d+(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d{3})*(?:\.\d+)?)|(\d+(?:\.\d{3})*(?:,\d+)?|\d+(?:,\d{3})*(?:\.\d+)?)/);
  const valueStr = match?.[1] || match?.[2];
  if (!valueStr) {
    return null;
  }

  const hasComma = valueStr.includes(",");
  const hasDot = valueStr.includes(".");

  let normalized = valueStr;
  if (hasComma && hasDot) {
    normalized = valueStr.replace(/\./g, "").replace(",", ".");
  } else if (hasDot && /^\d{1,3}(\.\d{3})+$/.test(valueStr)) {
    normalized = valueStr.replace(/\./g, "");
  } else if (hasComma && /^\d{1,3}(,\d{3})+$/.test(valueStr)) {
    normalized = valueStr.replace(/,/g, "");
  } else if (hasComma) {
    normalized = valueStr.replace(",", ".");
  }

  const value = parseFloat(normalized);
  return !isNaN(value) && value > 0 ? value : null;
}

/**
 * Extrai descrição do texto, removendo valores e palavras comuns
 */
export function extractDescription(text: string): string {
  let description = text.trim();
  
  // Remove valores monetários
  description = description.replace(/r\$\s*[\d.,]+/gi, '');
  description = description.replace(/[\d.,]+\s*(reais|r\$)?/gi, '');
  
  // Remove palavras comuns de transação
  const commonWords = [
    'gastei', 'paguei', 'comprei', 'pago', 'gasto', 'compra', 'pagamento',
    'de', 'em', 'no', 'na', 'do', 'da', 'para', 'por', 'com',
    'reais', 'r$', 'rs', 'real'
  ];
  
  commonWords.forEach(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'gi');
    description = description.replace(regex, '');
  });
  
  // Remove espaços extras e pontuação no final
  description = description.trim().replace(/[.,;:!?]+$/, '');
  
  // Capitaliza primeira letra
  if (description.length > 0) {
    description = description.charAt(0).toUpperCase() + description.slice(1);
  }
  
  return description || 'Transação';
}

/**
 * Determina se é receita ou despesa baseado no texto
 */
export function extractKind(text: string): 'income' | 'expense' {
  const lowerText = text.toLowerCase();
  
  // Palavras que indicam receita
  const incomeWords = [
    'recebi', 'recebido', 'ganhei', 'ganho', 'salario', 'salário',
    'pagamento', 'receita', 'renda', 'bonus', 'bônus', 'comissão',
    'comissao', 'freelance', 'freela', 'projeto', 'cliente', 'venda',
    'lucro', 'dividendo', 'juros', 'aluguel recebido', 'deposito'
  ];
  
  // Verifica se é receita
  for (const word of incomeWords) {
    if (lowerText.includes(word)) {
      return 'income';
    }
  }
  
  // Por padrão, assume despesa
  return 'expense';
}

/**
 * Extrai todas as informações de uma transação do texto
 */
export function parseTransaction(text: string) {
  const amount = extractAmount(text);
  const description = extractDescription(text);
  const kind = extractKind(text);
  
  return {
    amount,
    description,
    kind
  };
}
