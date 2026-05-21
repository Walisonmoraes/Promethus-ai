import Link from "next/link";
import { HighlightIcon } from "@/components/HighlightIcon";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";

const metrics = [
  ["3x", "mais rapidez nos lançamentos"],
  ["24h", "visão contínua do seu dinheiro"],
  ["IA", "insights para decidir melhor"],
];

const highlights = [
  {
    icon: "chat" as const,
    title: "Chat financeiro",
    text: "Digite como você fala: paguei 120 no mercado, recebi salário, quero criar uma meta.",
  },
  {
    icon: "dashboard" as const,
    title: "Dashboard vivo",
    text: "Veja saldo, categorias, metas e histórico em uma tela pensada para leitura rápida.",
  },
  {
    icon: "babilonia" as const,
    title: "Modo Babilônia",
    text: "Use princípios financeiros clássicos com acompanhamento moderno e ações práticas.",
  },
  {
    icon: "reports" as const,
    title: "Relatórios claros",
    text: "Entenda onde o dinheiro entra, sai e fica parado antes que vire surpresa.",
  },
  {
    icon: "goals" as const,
    title: "Metas com contexto",
    text: "Transforme objetivos em planos acompanháveis, com aportes e progresso visível.",
  },
  {
    icon: "routine" as const,
    title: "Rotina sem planilha",
    text: "Menos abas, menos fórmulas, mais decisões com informação organizada.",
  },
];

const previewItems = [
  ["Mercado", "- R$ 186,40"],
  ["Salário", "+ R$ 5.200,00"],
  ["Meta viagem", "42%"],
];

const chatExamples = [
  {
    user: "Gastei 86,40 no mercado hoje",
    ai: "Lancei como Alimentação e já atualizei seu resumo do mês.",
  },
  {
    user: "Recebi 5.200 de salário",
    ai: "Entrada registrada. Seu saldo mensal ficou positivo.",
  },
  {
    user: "Quero guardar 600 para viagem",
    ai: "Aporte adicionado à meta viagem. Progresso atualizado.",
  },
];

const steps = [
  {
    step: "01",
    title: "Converse",
    text: "Descreva gastos, receitas e metas em linguagem natural — sem formulários longos.",
  },
  {
    step: "02",
    title: "Organize",
    text: "A IA categoriza, atualiza saldos e mantém seu histórico sempre coerente.",
  },
  {
    step: "03",
    title: "Decida",
    text: "Veja relatórios, progresso de metas e insights para agir com confiança.",
  },
];

const categoryBreakdown = [
  { label: "Moradia", value: 32, amount: "R$ 1.840" },
  { label: "Alimentação", value: 24, amount: "R$ 1.380" },
  { label: "Transporte", value: 14, amount: "R$ 805" },
  { label: "Lazer", value: 11, amount: "R$ 632" },
  { label: "Outros", value: 19, amount: "R$ 1.094" },
];

const reportStats = [
  { label: "Entradas do mês", value: "R$ 8.420", trend: "+12%", positive: true },
  { label: "Saídas do mês", value: "R$ 5.751", trend: "-4%", positive: true },
  { label: "Saldo livre", value: "R$ 2.669", trend: "sobra do mês", positive: null },
  { label: "Reservado em metas", value: "R$ 1.200", trend: "3 metas ativas", positive: null },
];

const goalsPreview = [
  { name: "Viagem", current: 2520, target: 6000, pct: 42 },
  { name: "Reserva emergência", current: 7800, target: 10000, pct: 78 },
  { name: "Curso", current: 960, target: 2400, pct: 40 },
];

const babiloniaPrinciples = [
  "Pague a si mesmo primeiro",
  "Controle despesas fixas e variáveis",
  "Faça o dinheiro trabalhar",
  "Proteja-se de perdas",
  "Invista em moradia consciente",
  "Garanta renda futura",
  "Aumente sua capacidade de ganhar",
];

const integrations = [
  {
    icon: "chat" as const,
    title: "Chat no app",
    text: "Lance e consulte tudo direto na central financeira.",
  },
  {
    icon: "routine" as const,
    title: "WhatsApp",
    text: "Registre gastos por mensagem e receba confirmações na hora.",
  },
  {
    icon: "reports" as const,
    title: "Open Finance",
    text: "Conecte contas para sincronizar movimentações com contexto.",
  },
];

const faqItems = [
  {
    q: "Preciso preencher planilhas ou categorias manualmente?",
    a: "Não. Você descreve em texto e o Prometheus organiza categorias, valores e impacto no seu resumo.",
  },
  {
    q: "Serve para celular e computadores?",
    a: "Sim. A experiência foi pensada para leitura rápida em qualquer tela, com foco em chat e dashboard.",
  },
  {
    q: "O Modo Babilônia substitui consultoria financeira?",
    a: "Ele traduz princípios clássicos em ações práticas e acompanhamento. Para decisões complexas, combine com orientação profissional.",
  },
  {
    q: "Meus dados ficam seguros?",
    a: "O acesso é autenticado e as integrações seguem boas práticas de segurança. Você controla o que conecta e registra.",
  },
];

const trustBadges = [
  "Lançamentos em segundos",
  "Categorização automática",
  "Metas com progresso visual",
  "Relatórios sem surpresa",
];

export default function LandingPage() {
  return (
    <main className="landing-page">
      <div className="landing-noise" aria-hidden="true"></div>
      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label={BRAND_NAME}>
          <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="landing-logo" />
        </Link>

        <nav className="landing-nav" aria-label="Navegação principal">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#visao">Visão geral</a>
          <a href="#faq">FAQ</a>
          <Link href="/login">Entrar</Link>
        </nav>
      </header>

      <section className="landing-hero">
        <div className="hero-copy">
          <p className="hero-kicker">Copiloto financeiro com IA</p>
          <h1>Prometheus AI</h1>
          <p className="hero-lead">
            A experiência financeira que começa com uma conversa e termina em
            clareza: lançamentos, metas, relatórios e decisões em um só lugar.
          </p>

          <div className="hero-actions">
            <Link href="/login" className="primary-cta">
              Começar agora
              <span aria-hidden="true">→</span>
            </Link>
            <a href="#recursos" className="secondary-cta">
              Ver recursos
            </a>
          </div>

          <div className="metric-strip" aria-label="Destaques do Prometheus AI">
            {metrics.map(([value, label]) => (
              <div key={label} className="metric-item">
                <strong>{value}</strong>
                <span>{label}</span>
              </div>
            ))}
          </div>

          <ul className="trust-strip" aria-label="Benefícios rápidos">
            {trustBadges.map((badge) => (
              <li key={badge}>{badge}</li>
            ))}
          </ul>
        </div>

        <div className="hero-panel" aria-label="Prévia do Prometheus AI">
          <div className="panel-topbar">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div className="assistant-card">
            <p className="assistant-label">Prometheus</p>
            <p>
              Seu mês está positivo. Quer separar R$ 600 para acelerar sua meta
              de viagem?
            </p>
          </div>
          <div className="chart-preview" aria-hidden="true">
            <span style={{ height: "42%" }}></span>
            <span style={{ height: "68%" }}></span>
            <span style={{ height: "54%" }}></span>
            <span style={{ height: "82%" }}></span>
            <span style={{ height: "61%" }}></span>
            <span style={{ height: "76%" }}></span>
          </div>
          <div className="preview-list">
            {previewItems.map(([label, value]) => (
              <div key={label} className="preview-row">
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="recursos" className="landing-section">
        <div className="section-heading">
          <p>Recursos</p>
          <h2>Menos esforço para entender seu dinheiro.</h2>
          <p className="section-lead">
            Tudo o que você precisa para sair do improviso: conversa, painel,
            metas, relatórios e educação financeira no mesmo ecossistema.
          </p>
        </div>

        <div className="highlight-grid">
          {highlights.map((item) => (
            <article key={item.title} className="highlight-card">
              <div className="highlight-card-icon" aria-hidden="true">
                <HighlightIcon name={item.icon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="como-funciona" className="landing-section split-section">
        <div>
          <p className="section-eyebrow">Lançamento por conversa</p>
          <h2>Registre despesas como se estivesse mandando uma mensagem.</h2>
          <p className="section-lead">
            Sem abas confusas: você fala, o Prometheus entende e devolve confirmação
            com categoria, impacto no saldo e próximo passo sugerido.
          </p>
        </div>
        <div className="chat-demo-card" aria-label="Exemplos de lançamentos no chat">
          {chatExamples.map((item) => (
            <div key={item.user} className="chat-demo-pair">
              <p className="chat-bubble user-bubble">{item.user}</p>
              <p className="chat-bubble ai-bubble">{item.ai}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="section-heading section-heading--center">
          <p>Fluxo simples</p>
          <h2>Do lançamento à decisão em três passos.</h2>
        </div>
        <ol className="steps-grid">
          {steps.map((item) => (
            <li key={item.step} className="step-card">
              <span className="step-number">{item.step}</span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </li>
          ))}
        </ol>
      </section>

      <section id="visao" className="landing-section split-section split-section--reverse">
        <div className="dashboard-demo" aria-label="Prévia do dashboard">
          <div className="dashboard-demo-header">
            <div>
              <p className="assistant-label">Visão do mês</p>
              <strong className="dashboard-balance">R$ 2.669,00</strong>
              <span className="dashboard-balance-hint">saldo livre após lançamentos</span>
            </div>
            <span className="dashboard-badge">Maio 2026</span>
          </div>
          <div className="dashboard-categories">
            {categoryBreakdown.map((item) => (
              <div key={item.label} className="dashboard-category-row">
                <div className="dashboard-category-meta">
                  <span>{item.label}</span>
                  <strong>{item.amount}</strong>
                </div>
                <div className="dashboard-category-bar" aria-hidden="true">
                  <span style={{ width: `${item.value}%` }}></span>
                </div>
              </div>
            ))}
          </div>
          <div className="dashboard-mini-metrics">
            <div className="metric-item">
              <strong>24</strong>
              <span>lançamentos</span>
            </div>
            <div className="metric-item">
              <strong>5</strong>
              <span>categorias</span>
            </div>
            <div className="metric-item">
              <strong>3</strong>
              <span>metas ativas</span>
            </div>
          </div>
        </div>
        <div>
          <p className="section-eyebrow">Dashboard vivo</p>
          <h2>Uma tela para ler saldo, categorias e ritmo do mês.</h2>
          <p className="section-lead">
            O painel resume o que importa: quanto entrou, quanto saiu, onde está
            concentrado o gasto e se você está no caminho das metas.
          </p>
          <ul className="landing-checklist">
            <li>Saldo e fluxo mensal em destaque</li>
            <li>Distribuição por categoria com valores reais</li>
            <li>Indicadores rápidos de lançamentos e metas</li>
          </ul>
        </div>
      </section>

      <section id="relatorios" className="landing-section">
        <div className="section-heading">
          <p>Relatórios claros</p>
          <h2>Entenda entradas, saídas e o que sobra antes do fim do mês.</h2>
        </div>
        <div className="report-grid">
          {reportStats.map((item) => (
            <article key={item.label} className="report-card">
              <span className="report-label">{item.label}</span>
              <strong className="report-value">{item.value}</strong>
              <span
                className={`report-trend ${
                  item.positive === true ? "report-trend--up" : ""
                }`}
              >
                {item.trend}
              </span>
            </article>
          ))}
        </div>
        <p className="section-footnote">
          Dados ilustrativos para demonstrar a leitura do painel — seus números
          reais aparecem após os primeiros lançamentos.
        </p>
      </section>

      <section id="metas" className="landing-section">
        <div className="section-heading section-heading--center">
          <p>Metas com contexto</p>
          <h2>Objetivos que mostram progresso, aporte e distância da meta.</h2>
        </div>
        <div className="goals-preview-grid">
          {goalsPreview.map((goal) => (
            <article key={goal.name} className="goal-preview-card">
              <div className="goal-preview-top">
                <h3>{goal.name}</h3>
                <span>{goal.pct}%</span>
              </div>
              <div className="goal-preview-bar" aria-hidden="true">
                <span style={{ width: `${goal.pct}%` }}></span>
              </div>
              <p>
                R$ {goal.current.toLocaleString("pt-BR")} de R${" "}
                {goal.target.toLocaleString("pt-BR")}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section split-section">
        <div className="split-section-copy">
          <p className="section-eyebrow">Modo Babilônia</p>
          <h2>Princípios clássicos com acompanhamento moderno.</h2>
          <p className="section-lead">
            Transforme educação financeira em rotina: cada princípio vira ação
            prática conectada ao que você já registrou no Prometheus.
          </p>
        </div>
        <ul className="babilonia-grid" aria-label="Princípios do Modo Babilônia">
          {babiloniaPrinciples.map((principle, index) => (
            <li key={principle} className="babilonia-pill">
              <span className="babilonia-index">{index + 1}</span>
              <span>{principle}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="landing-section">
        <div className="section-heading section-heading--center">
          <p>Onde você usa</p>
          <h2>Do chat ao WhatsApp, tudo no mesmo fluxo financeiro.</h2>
        </div>
        <div className="integration-grid">
          {integrations.map((item) => (
            <article key={item.title} className="integration-card">
              <div className="highlight-card-icon integration-card-icon" aria-hidden="true">
                <HighlightIcon name={item.icon} />
              </div>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="faq" className="landing-section">
        <div className="section-heading section-heading--center">
          <p>Perguntas frequentes</p>
          <h2>Tire dúvidas antes de começar.</h2>
        </div>
        <div className="faq-list">
          {faqItems.map((item) => (
            <details key={item.q} className="faq-item">
              <summary>{item.q}</summary>
              <p>{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="landing-final">
        <div>
          <p className="section-eyebrow">Pronto para evoluir</p>
          <h2>Saia das planilhas e pranchetas da idade da pedra. Use o poder da IA.</h2>
          <p className="section-lead landing-final-lead">
            Crie sua conta, faça o primeiro lançamento por chat e veja seu mês
            ganhar forma em minutos.
          </p>
        </div>
        <Link href="/login" className="primary-cta">
          Começar agora
          <span aria-hidden="true">→</span>
        </Link>
      </section>

      <footer className="landing-footer">
        <Link href="/" className="landing-brand" aria-label={BRAND_NAME}>
          <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="landing-logo landing-logo--small" />
        </Link>
        <nav className="landing-footer-nav" aria-label="Links do rodapé">
          <a href="#recursos">Recursos</a>
          <a href="#como-funciona">Como funciona</a>
          <a href="#visao">Visão geral</a>
          <a href="#faq">FAQ</a>
          <Link href="/login">Entrar</Link>
        </nav>
        <p className="landing-footer-copy">
          Copiloto financeiro com IA — lançamentos, metas e clareza em um só lugar.
        </p>
      </footer>
    </main>
  );
}
