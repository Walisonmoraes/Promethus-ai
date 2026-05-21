// Sistema de categorização local com palavras-chave brasileiras
const categoryKeywords = {
  Alimentacao: [
    'comida', 'alimento', 'restaurante', 'lanchonete', 'cafe', 'almoco', 'jantar',
    'mercado', 'supermercado', 'padaria', 'bolacha', 'biscoito', 'pao', 'arroz',
    'feijao', 'carne', 'frango', 'peixe', 'legume', 'fruta', 'verdura', 'leite',
    'queijo', 'ovo', 'macarrao', 'pizza', 'hamburguer', 'hot dog', 'sorvete',
    'doce', 'bolo', 'chocolate', 'refrigerante', 'suco', 'agua', 'cerveja',
    'delivery', 'ifood', 'rappi', 'uber eats', 'comida', 'lanche', 'snack'
  ],
  Saude: [
    'remedio', 'medicamento', 'farmacia', 'drogaria', 'medico', 'medica',
    'hospital', 'clinica', 'consulta', 'exame', 'dentista', 'odonto',
    'plano de saude', 'unimed', 'bradesco saude', 'amil', 'sulamerica',
    'oftalmo', 'psicologo', 'terapia', 'fisioterapeuta', 'vacina', 'lente',
    'oculos', 'colirio', 'vitamina', 'suplemento', 'elise', 'dipirona'
  ],
  Transporte: [
    'uber', '99', 'taxi', 'onibus', 'metro', 'trem', 'combustivel', 'gasolina',
    'alcool', 'diesel', 'posto', 'pedagio', 'estacionamento', 'multa',
    'ipva', 'licenciamento', 'manutencao', 'mecanico', 'pneu', 'oleo',
    'bicicleta', 'patinete', 'moto', 'carro', 'passagem',
    'aereo', 'aviao', 'rodoviaria', 'aplicativo', 'corrida'
  ],
  Moradia: [
    'aluguel', 'condominio', 'agua', 'luz', 'energia', 'internet', 'net',
    'vivo', 'claro', 'oi', 'telefone', 'celular', 'gas', 'encanador',
    'eletricista', 'reforma', 'mobilia', 'moveis', 'eletro', 'geladeira',
    'fogao', 'maquina', 'televisao', 'tv', 'ar condicionado', 'lava roupa',
    'secadora', 'microondas', 'cama', 'sofa', 'mesa', 'cadeira', 'decoracao',
    'conta de luz', 'conta de agua'
  ],
  Educacao: [
    'escola', 'faculdade', 'universidade', 'curso', 'aula', 'livro', 'livraria',
    'material', 'escolar', 'mensalidade', 'matricula', 'pos', 'mba', 'ingles',
    'idioma', 'espanhol', 'frances', 'alemao', 'online', 'platzi', 'udemy',
    'alura', 'rocketseat', 'escola', 'colegio', 'educacao', 'ensino'
  ],
  Lazer: [
    'cinema', 'teatro', 'show', 'concerto', 'festival', 'parque', 'praia',
    'viagem', 'hotel', 'pousada', 'airbnb', 'booking', 'jogo', 'playstation',
    'xbox', 'nintendo', 'steam', 'netflix', 'spotify', 'prime', 'disney',
    'hbo', 'gym', 'academia', 'personal', 'esporte', 'futebol', 'natacao',
    'yoga', 'pilates', 'bar', 'balada', 'festa', 'clube', 'entretenimento',
    'mensalidade', 'assinatura', 'streaming'
  ],
  Compras: [
    'roupa', 'calcado', 'sapato', 'tenis', 'bota', 'camisa', 'calca',
    'vestido', 'blusa', 'jaqueta', 'casaco', 'bermuda', 'short', 'meia',
    'roupa', 'loja', 'shopping', 'magazine', 'riachuelo', 'renner', 'c&a',
    'zara', 'h&m', 'cos', 'pull bear', 'bershka', 'mango', 'acessorio',
    'bijuteria', 'relogio', 'brinco', 'colar', 'anel', 'perfume', 'maquiagem'
  ],
  Servicos: [
    'streaming', 'netflix', 'spotify', 'youtube', 'prime', 'disney', 'hbo',
    'apple music', 'spotify', 'assinatura', 'mensalidade', 'plano', 'seguro',
    'banco', 'cartao', 'anuidade', 'juros', 'emprestimo', 'financiamento',
    'consignado', 'imposto', 'taxa', 'tarifa', 'servico', 'manutencao',
    'limpeza', 'faxina', 'diarista', 'encanador', 'eletricista', 'pintor'
  ],
  Investimentos: [
    'acao', 'tesouro', 'cdb', 'lci', 'lca', 'fundo', 'investimento',
    'renda fixa', 'renda variavel', 'bitcoin', 'cripto', 'crypto', 'ethereum',
    'xp', 'nuinvest', 'inter', 'modal', 'rico', 'clear', 'b3', 'corretora',
    'aplicacao', 'resgate', 'dividendos', 'juros', 'poupanca', 'acao'
  ],
  Salario: [
    'salario', 'salário', 'holerite', 'contracheque', 'pagamento', 'recebimento',
    'recebi', 'deposito', 'transferencia', 'renda', 'provento', 'ordenado',
    'mensal', 'quinzena', 'semana', 'dia', 'hora', 'comissao', 'bonus'
  ],
  Freelancer: [
    'freelancer', 'freela', 'projeto', 'cliente', 'servico', 'consultoria',
    'design', 'desenvolvimento', 'programacao', 'redacao', 'traducao',
    'video', 'foto', 'marketing', 'social', 'midia', 'conteudo', 'blog',
    'site', 'app', 'sistema', 'autonomo', 'autônomo', 'pj', 'pessoa juridica'
  ],
  Outros: []
}

const categoryPriority = [
  'Saude',
  'Lazer',
  'Alimentacao',
  'Transporte',
  'Educacao',
  'Compras',
  'Moradia',
  'Investimentos',
  'Freelancer',
  'Salario',
  'Servicos',
  'Outros'
]

export function categorizeLocally(text: string): string {
  const lowerText = text.toLowerCase()

  for (const category of categoryPriority) {
    if (category === 'Outros') continue

    const keywords = categoryKeywords[category as keyof typeof categoryKeywords]
    if (!keywords) continue

    for (const keyword of keywords) {
      if (lowerText.includes(keyword.toLowerCase())) {
        return category
      }
    }
  }

  return 'Outros'
}
