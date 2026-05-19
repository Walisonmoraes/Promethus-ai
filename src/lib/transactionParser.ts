// Funções para extrair informações de texto de transação

/**
 * Extrai valor monetário de um texto
 * Suporta formatos: R$ 10,99, 10.99, 10,99, 10.99 reais, etc.
 */
export function extractAmount(text: string): number | null {
  // Remove espaços extras
  const cleanText = text.trim().toLowerCase();
  
  // Padrões regex para diferentes formatos de valor
  const patterns = [
    // R$ 10,99 ou R$10.99
    /r\$\s*([\d.,]+)/,
    // 10,99 ou 10.99
    /(\d+[.,]\d{2})/,
    // 10 (valor inteiro)
    /(\d+)/
  ];
  
  for (const pattern of patterns) {
    const match = cleanText.match(pattern);
    if (match) {
      let valueStr = match[1];
      
      // Normaliza separadores: troca ponto por nada, vírgula por ponto
      valueStr = valueStr.replace(/\./g, '').replace(',', '.');
      
      const value = parseFloat(valueStr);
      if (!isNaN(value) && value > 0) {
        return value;
      }
    }
  }
  
  return null;
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
