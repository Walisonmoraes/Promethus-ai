"use client";

import Link from "next/link";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { HighlightIcon } from "@/components/HighlightIcon";

interface LoginFormData {
  email: string;
  password: string;
  username: string;
}

const promoFeatures = [
  { icon: "chat" as const, label: "Lançamentos por conversa" },
  { icon: "dashboard" as const, label: "Dashboard com leitura rápida" },
  { icon: "goals" as const, label: "Metas com progresso visível" },
];

export default function LoginGlass() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
    username: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const leftEyebrow = isLoginMode ? "Copiloto financeiro" : "Comece agora";
  const leftTitle = isLoginMode ? "Volte para o seu painel" : "Crie sua base financeira";
  const leftDescription = isLoginMode
    ? "Entre para continuar acompanhando lançamentos, metas e decisões com contexto."
    : "Organize receitas, despesas e objetivos em um espaço visual claro e inteligente.";
  const formTitle = isLoginMode ? "Entrar" : "Criar conta";
  const formSubtitle = isLoginMode
    ? "Acesse sua central financeira com segurança."
    : "Comece sua organização financeira com uma conta nova.";
  const submitLabel = isLoginMode ? "Entrar" : "Criar conta";
  const modeToggleLabel = isLoginMode ? "Quero me cadastrar" : "Já tenho conta";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLoginMode) {
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));
          router.push("/app");
        } else {
          setError(data.message || "Erro ao fazer login");
        }
      } else {
        setError("Funcionalidade de cadastro em desenvolvimento");
      }
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError("");

    try {
      await signIn("google", {
        callbackUrl: "/app",
        redirect: true,
      });
    } catch {
      setError("Erro ao fazer login com Google. Tente novamente.");
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleMode = () => {
    setIsLoginMode(!isLoginMode);
    setError("");
    setShowPassword(false);
    setFormData({ email: "", password: "", username: "" });
  };

  return (
    <main className="landing-page login-page">
      <div className="landing-noise" aria-hidden="true"></div>

      <header className="landing-header">
        <Link href="/" className="landing-brand" aria-label={BRAND_NAME}>
          <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="landing-logo" />
        </Link>

        <nav className="landing-nav" aria-label="Navegação de login">
          <Link href="/">Voltar ao site</Link>
        </nav>
      </header>

      <section className="login-shell" aria-label="Autenticação">
        <div className="login-panel">
          <div className="panel-topbar" aria-hidden="true">
            <span></span>
            <span></span>
            <span></span>
          </div>

          <div className={`login-grid ${!isLoginMode ? "login-grid--register" : ""}`}>
            <aside className="login-promo">
              <p className="section-eyebrow">{leftEyebrow}</p>
              <h1 className="login-promo-title">{leftTitle}</h1>
              <p className="login-promo-text">{leftDescription}</p>

              <ul className="login-feature-list">
                {promoFeatures.map((item) => (
                  <li key={item.label} className="login-feature-item">
                    <span className="highlight-card-icon login-feature-icon" aria-hidden="true">
                      <HighlightIcon name={item.icon} />
                    </span>
                    <span>{item.label}</span>
                  </li>
                ))}
              </ul>

              <button type="button" className="secondary-cta login-mode-cta" onClick={toggleMode}>
                {modeToggleLabel}
              </button>
            </aside>

            <div className="login-form-column">
              <div className="login-form-heading">
                <h2 className="login-form-title">{formTitle}</h2>
                <p className="login-form-subtitle">{formSubtitle}</p>
                <button type="button" className="login-form-toggle" onClick={toggleMode}>
                  {modeToggleLabel}
                </button>
              </div>

              <form onSubmit={handleSubmit} className="login-form">
                {!isLoginMode && (
                  <label className="login-field">
                    <span className="login-field-label">Usuário</span>
                    <div className="login-input-wrap">
                      <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                      <input
                        type="text"
                        name="username"
                        placeholder="Seu nome de usuário"
                        value={formData.username}
                        onChange={handleChange}
                        className="login-input"
                        required={!isLoginMode}
                      />
                    </div>
                  </label>
                )}

                <label className="login-field">
                  <span className="login-field-label">Email</span>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                    <input
                      type="email"
                      name="email"
                      placeholder="seu@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      className="login-input"
                      required
                    />
                  </div>
                </label>

                <label className="login-field">
                  <span className="login-field-label">Senha</span>
                  <div className="login-input-wrap">
                    <svg className="login-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      placeholder="Sua senha"
                      value={formData.password}
                      onChange={handleChange}
                      className="login-input"
                      required
                    />
                    <button
                      type="button"
                      className="login-password-toggle"
                      aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                      onClick={() => setShowPassword((current) => !current)}
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                        <circle cx="12" cy="12" r="3" />
                        {!showPassword && <path d="M3 21L21 3" />}
                      </svg>
                    </button>
                  </div>
                </label>

                {isLoginMode && (
                  <div className="login-form-meta">
                    <label className="login-remember">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                      />
                      <span>Lembrar de mim</span>
                    </label>
                    <button type="button" className="login-forgot">
                      Esqueci minha senha
                    </button>
                  </div>
                )}

                {error && <div className="login-error" role="alert">{error}</div>}

                <button type="submit" className="primary-cta login-submit" disabled={isLoading}>
                  {isLoading ? <span className="login-spinner" aria-hidden="true"></span> : submitLabel}
                </button>
              </form>

              <p className="login-divider" aria-hidden="true">
                <span>ou</span>
              </p>

              <button
                type="button"
                className="secondary-cta login-google"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <span className="login-spinner" aria-hidden="true"></span>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="login-google-icon" aria-hidden="true">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Entrar com Google
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
