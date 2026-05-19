"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

interface LoginFormData {
  email: string;
  password: string;
  username: string;
}

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
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      if (isLoginMode) {
        // Login com email/senha
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
          router.push("/");
        } else {
          setError(data.message || "Erro ao fazer login");
        }
      } else {
        // Cadastro (simulado)
        setError("Funcionalidade de cadastro em desenvolvimento");
      }
    } catch (err) {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    console.log("handleGoogleLogin chamado");
    setIsGoogleLoading(true);
    setError("");

    try {
      console.log("Chamando signIn do NextAuth");
      await signIn("google", {
        callbackUrl: "/",
        redirect: true,
      });
      console.log("SignIn executado com sucesso");
    } catch (err) {
      console.log("Erro no signIn:", err);
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
    setFormData({ email: "", password: "", username: "" });
  };

  return (
    <div className="glass-container">
      {/* Background com mesh gradient */}
      <div className="mesh-background">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
        <div className="blob blob-4"></div>
        <div className="blob blob-5"></div>
      </div>

      {/* Main Glass Card */}
      <div className="main-glass-card">
        <div className="auth-container">
          {/* Left Panel */}
          <div className={`left-panel ${!isLoginMode ? 'left-panel-overlay' : ''}`}>
            <div className="left-content">
              <div className="prometheus-logo">
                <img src="/logo.png" alt="Prometheus AI" className="logo-image-glass" />
              </div>
              
              <div className="brand-name">
                <h3 className="prometheus-title">Prometheus AI</h3>
                <p className="brand-subtitle">Seu copiloto financeiro</p>
              </div>
              
              <div className="left-texts">
                <p className="subtitle">BEM VINDO</p>
                <h2 className="title underlined">
                  {isLoginMode ? "Inscreva-se" : "CADASTRE-SE"}
                </h2>
              </div>
              
              <button 
                className="btn-primary"
                onClick={toggleMode}
              >
                {isLoginMode ? "Fazer Login" : "Já tem conta?"}
              </button>

              <div className="social-icons">
                <div className="social-icon google" onClick={handleGoogleLogin}>
                  <svg viewBox="0 0 24 24" className="social-logo">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                </div>
                <div className="social-icon apple">
                  <svg viewBox="0 0 24 24" className="social-logo">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Separator */}
          <div className="separator">
            <button className="toggle-switch" onClick={toggleMode}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 8L21 12L17 16M7 8L3 12L7 16"/>
              </svg>
            </button>
          </div>

          {/* Right Panel */}
          <div className="right-panel">
            <div className="right-content">
              <h2 className="right-title">
                {isLoginMode ? "ENTRAR" : "CADASTRE-SE"}
              </h2>

              <form onSubmit={handleSubmit} className="auth-form">
                {!isLoginMode && (
                  <div className="input-group">
                    <div className="input-wrapper">
                      <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <input
                        type="text"
                        name="username"
                        placeholder="USUÁRIO"
                        value={formData.username}
                        onChange={handleChange}
                        className="pill-input"
                        required={!isLoginMode}
                      />
                    </div>
                  </div>
                )}

                <div className="input-group">
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                      <polyline points="22,6 12,13 2,6"/>
                    </svg>
                    <input
                      type="email"
                      name="email"
                      placeholder="EMAIL"
                      value={formData.email}
                      onChange={handleChange}
                      className="pill-input"
                      required
                    />
                  </div>
                </div>

                <div className="input-group">
                  <div className="input-wrapper">
                    <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                    <input
                      type="password"
                      name="password"
                      placeholder="******"
                      value={formData.password}
                      onChange={handleChange}
                      className="pill-input"
                      required
                    />
                    <svg className="input-icon-right" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  </div>
                </div>

                {isLoginMode && (
                  <div className="checkbox-group">
                    <label className="checkbox-label">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="checkbox-input"
                      />
                      <span className="checkbox-text">Lembrar de mim</span>
                    </label>
                  </div>
                )}

                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="btn-primary-action" disabled={isLoading}>
                  {isLoading ? (
                    <div className="spinner"></div>
                  ) : (
                    "Entrar"
                  )}
                </button>
              </form>

              <div className="divider-text">ou</div>

              <button 
                className="btn-secondary"
                onClick={handleGoogleLogin}
                disabled={isGoogleLoading}
              >
                {isGoogleLoading ? (
                  <div className="spinner"></div>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" className="google-icon-small">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                    Entrar com Google
                  </>
                )}
              </button>

                          </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .glass-container {
          min-height: 100vh;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .glass-container {
            padding: 16px;
          }
        }

        @media (max-width: 480px) {
          .glass-container {
            padding: 12px;
          }
        }

        /* Mesh Gradient Background */
        .mesh-background {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 0;
        }

        .blob {
          position: absolute;
          border-radius: 50%;
          filter: blur(80px);
          opacity: 0.7;
          animation: float 20s infinite ease-in-out;
        }

        .blob-1 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #9333ea, #a855f7);
          top: -100px;
          left: -100px;
          animation-delay: 0s;
        }

        .blob-2 {
          width: 350px;
          height: 350px;
          background: linear-gradient(135deg, #fbbf24, #fcd34d);
          top: 50%;
          right: -100px;
          animation-delay: 3s;
        }

        .blob-3 {
          width: 300px;
          height: 300px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          bottom: -100px;
          left: 30%;
          animation-delay: 6s;
        }

        .blob-4 {
          width: 250px;
          height: 250px;
          background: linear-gradient(135deg, #ec4899, #f472b6);
          top: 30%;
          left: 60%;
          animation-delay: 9s;
        }

        .blob-5 {
          width: 280px;
          height: 280px;
          background: linear-gradient(135deg, #14b8a6, #22d3ee);
          bottom: 20%;
          right: 30%;
          animation-delay: 12s;
        }

        /* Mobile blobs optimization */
        @media (max-width: 768px) {
          .blob-1, .blob-2, .blob-3, .blob-4, .blob-5 {
            filter: blur(60px);
            opacity: 0.5;
          }
          
          .blob-1 {
            width: 300px;
            height: 300px;
          }
          
          .blob-2 {
            width: 250px;
            height: 250px;
          }
          
          .blob-3 {
            width: 200px;
            height: 200px;
          }
          
          .blob-4 {
            width: 180px;
            height: 180px;
          }
          
          .blob-5 {
            width: 200px;
            height: 200px;
          }
        }

        @media (max-width: 480px) {
          .blob-1, .blob-2, .blob-3, .blob-4, .blob-5 {
            filter: blur(40px);
            opacity: 0.4;
          }
          
          .blob-1 {
            width: 200px;
            height: 200px;
          }
          
          .blob-2 {
            width: 180px;
            height: 180px;
          }
          
          .blob-3 {
            width: 150px;
            height: 150px;
          }
          
          .blob-4 {
            width: 130px;
            height: 130px;
          }
          
          .blob-5 {
            width: 140px;
            height: 140px;
          }
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(30px, -50px) scale(1.1); }
          50% { transform: translate(-20px, 30px) scale(0.9); }
          75% { transform: translate(40px, 20px) scale(1.05); }
        }

        /* Main Glass Card */
        .main-glass-card {
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          border-radius: 24px;
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.1);
          position: relative;
          z-index: 1;
          max-width: 1000px;
          width: 100%;
          min-height: 600px;
        }

        /* Mobile card optimization */
        @media (max-width: 768px) {
          .main-glass-card {
            max-width: 100%;
            min-height: auto;
            border-radius: 20px;
          }
        }

        @media (max-width: 480px) {
          .main-glass-card {
            border-radius: 16px;
            min-height: 500px;
          }
        }

        .auth-container {
          display: flex;
          min-height: 600px;
        }

        /* Mobile layout - stack panels vertically */
        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
            min-height: auto;
          }
        }

        /* Left Panel */
        .left-panel {
          flex: 1;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 24px 0 0 24px;
        }

        /* Mobile left panel */
        @media (max-width: 768px) {
          .left-panel {
            padding: 32px 24px;
            border-radius: 20px 20px 0 0;
            min-height: 200px;
          }
        }

        @media (max-width: 480px) {
          .left-panel {
            padding: 24px 16px;
            border-radius: 16px 16px 0 0;
            min-height: 160px;
          }
        }

        .left-panel-overlay {
          background: linear-gradient(135deg, rgba(255,255,255,0.6) 0%, rgba(255,210,150,0.6) 100%);
        }

        .left-content {
          text-align: center;
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }

        .prometheus-logo {
          width: 120px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Mobile logo optimization */
        @media (max-width: 768px) {
          .prometheus-logo {
            width: 80px;
            height: 80px;
          }
        }

        @media (max-width: 480px) {
          .prometheus-logo {
            width: 60px;
            height: 60px;
          }
        }

        .logo-image-glass {
          width: 100%;
          height: 100%;
          object-fit: contain;
          border: none;
          padding: 0;
          margin: 0;
          display: block;
        }

        .brand-name {
          text-align: center;
          margin-bottom: 0px;
          position: relative;
          top: -25px;
        }

        .prometheus-title {
          color: #0f0e2e;
          font-size: 1.8rem;
          font-weight: 800;
          margin: 0 0 4px 0;
          letter-spacing: 0.02em;
        }

        .brand-subtitle {
          color: #4a4a6e;
          font-size: 0.9rem;
          font-weight: 500;
          margin: 0;
          letter-spacing: 0.05em;
        }

        /* Mobile text optimization */
        @media (max-width: 768px) {
          .prometheus-title {
            font-size: 1.4rem;
          }
          
          .brand-subtitle {
            font-size: 0.8rem;
          }
        }

        @media (max-width: 480px) {
          .prometheus-title {
            font-size: 1.2rem;
          }
          
          .brand-subtitle {
            font-size: 0.7rem;
          }
        }

        .subtitle {
          color: #1a1a2e;
          font-size: 0.9rem;
          font-weight: 600;
          letter-spacing: 0.1em;
          margin: 0;
        }

        .title {
          color: #0f0e2e;
          font-size: 2.5rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin: 0;
          position: relative;
        }

        .underlined {
          display: inline-block;
        }

        .underlined::after {
          content: '';
          position: absolute;
          bottom: -8px;
          left: 10%;
          width: 80%;
          height: 3px;
          background: #0f0e2e;
        }

        /* Separator */
        .separator {
          width: 80px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        .separator::before {
          content: '';
          position: absolute;
          width: 1px;
          height: 60%;
          background: rgba(255, 255, 255, 0.5);
        }

        .toggle-switch {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #ffffff;
          border: none;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333333;
          transition: all 0.3s ease;
          z-index: 1;
        }

        .toggle-switch:hover {
          transform: scale(1.1);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
        }

        .toggle-switch svg {
          width: 24px;
          height: 24px;
        }

        /* Right Panel */
        .right-panel {
          flex: 1.2;
          padding: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Mobile right panel */
        @media (max-width: 768px) {
          .right-panel {
            padding: 32px 24px;
            flex: 1;
          }
        }

        @media (max-width: 480px) {
          .right-panel {
            padding: 24px 16px;
          }
        }

        .right-content {
          width: 100%;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* Mobile right content */
        @media (max-width: 768px) {
          .right-content {
            max-width: 100%;
            gap: 20px;
          }
        }

        @media (max-width: 480px) {
          .right-content {
            gap: 16px;
          }
        }

        .right-title {
          color: #0f0e2e;
          font-size: 2rem;
          font-weight: 800;
          letter-spacing: 0.05em;
          margin: 0;
          text-align: center;
        }

        /* Mobile title optimization */
        @media (max-width: 768px) {
          .right-title {
            font-size: 1.6rem;
          }
        }

        @media (max-width: 480px) {
          .right-title {
            font-size: 1.4rem;
          }
        }

        /* Form Elements */
        .auth-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .input-wrapper {
          position: relative;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.25);
          border: none;
          border-radius: 50px;
          padding: 0 20px;
        }

        .input-icon {
          width: 20px;
          height: 20px;
          color: #1a1a2e;
          margin-right: 12px;
        }

        .input-icon-right {
          width: 20px;
          height: 20px;
          color: #1a1a2e;
          margin-left: 12px;
          cursor: pointer;
        }

        .pill-input {
          flex: 1;
          background: transparent;
          border: none;
          padding: 16px 0;
          font-size: 1rem;
          color: #0f0e2e;
          font-weight: 600;
          outline: none;
        }

        /* Mobile input optimization */
        @media (max-width: 480px) {
          .pill-input {
            padding: 14px 0;
            font-size: 0.9rem;
          }
          
          .input-wrapper {
            padding: 0 16px;
          }
          
          .input-icon, .input-icon-right {
            width: 18px;
            height: 18px;
          }
          
          .input-icon {
            margin-right: 10px;
          }
          
          .input-icon-right {
            margin-left: 10px;
          }
        }

        .pill-input::placeholder {
          color: #4a4a6e;
          font-weight: 600;
          letter-spacing: 0.05em;
        }

        .input-wrapper::before {
          content: '';
          position: absolute;
          left: 40px;
          top: 50%;
          transform: translateY(-50%);
          width: 1px;
          height: 24px;
          background: rgba(0, 0, 0, 0.2);
        }

        /* Checkbox */
        .checkbox-group {
          display: flex;
          align-items: center;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          color: #1a1a2e;
          font-size: 0.9rem;
          font-weight: 600;
        }

        .checkbox-input {
          width: 16px;
          height: 16px;
          accent-color: #3a3c5a;
        }

        /* Buttons */
        .btn-primary {
          background: linear-gradient(to right, #fae8d4, #eacda3);
          color: #333333;
          border: none;
          border-radius: 50px;
          padding: 16px 32px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
        }

        .btn-primary-action {
          background: #3a3c5a;
          color: #ffffff;
          border: none;
          border-radius: 50px;
          padding: 16px 32px;
          font-size: 1rem;
          font-weight: bold;
          cursor: pointer;
          box-shadow: 0 8px 20px rgba(58, 60, 90, 0.4);
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* Mobile button optimization */
        @media (max-width: 768px) {
          .btn-primary-action {
            padding: 14px 28px;
            font-size: 0.95rem;
          }
        }

        @media (max-width: 480px) {
          .btn-primary-action {
            padding: 12px 24px;
            font-size: 0.9rem;
          }
        }

        .btn-primary-action:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(58, 60, 90, 0.5);
        }

        .btn-primary-action:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: rgba(255, 255, 255, 0.3);
          color: #333333;
          border: none;
          border-radius: 50px;
          padding: 16px 24px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.3s ease;
        }

        /* Mobile secondary button optimization */
        @media (max-width: 768px) {
          .btn-secondary {
            padding: 14px 20px;
            font-size: 0.85rem;
            gap: 10px;
          }
        }

        @media (max-width: 480px) {
          .btn-secondary {
            padding: 12px 16px;
            font-size: 0.8rem;
            gap: 8px;
          }
          
          .google-icon-small {
            width: 18px;
            height: 18px;
          }
        }

        .btn-secondary:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.4);
          transform: translateY(-1px);
        }

        .btn-secondary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .google-icon-small {
          width: 20px;
          height: 20px;
        }

        /* Divider */
        .divider-text {
          text-align: center;
          color: #4a4a6e;
          font-size: 0.9rem;
          font-weight: 600;
          margin: 8px 0;
        }

        /* Social Icons */
        .social-icons {
          display: flex;
          gap: 16px;
          justify-content: center;
        }

        .social-icon {
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 0.8rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .social-icon.google {
          background: rgba(234, 67, 53, 0.1);
          color: #ea4335;
          cursor: pointer;
        }

        .social-icon.apple {
          background: rgba(0, 0, 0, 0.1);
          color: #000000;
          cursor: pointer;
        }

        .social-logo {
          width: 24px;
          height: 24px;
          fill: currentColor;
        }

        .social-icon:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }

        /* Spinner */
        .spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top: 2px solid #ffffff;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Error Message */
        .error-message {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 12px;
          padding: 12px;
          color: #dc2626;
          font-size: 0.85rem;
          text-align: center;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .auth-container {
            flex-direction: column;
          }

          .left-panel,
          .right-panel {
            padding: 32px 24px;
          }

          .separator {
            width: 100%;
            height: 40px;
          }

          .separator::before {
            width: 60%;
            height: 1px;
          }

          .title {
            font-size: 2rem;
          }

          .right-title {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
