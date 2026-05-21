"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { BRAND_LOGO_SRC, BRAND_NAME } from "@/lib/brand";

interface LoginFormData {
  email: string;
  password: string;
}

export default function Login() {
  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        router.push("/");
      } else {
        setError(data.message || "Erro ao fazer login");
      }
    } catch (err) {
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
        callbackUrl: "/",
        redirect: false,
      });
    } catch (err) {
      setError("Erro ao fazer login com Google. Tente novamente.");
      setIsGoogleLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src={BRAND_LOGO_SRC} alt={BRAND_NAME} className="login-logo-full" />
          <p className="login-subtitle">Seu copiloto financeiro inteligente</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {error && <div className="login-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="email" className="form-label">
              E-mail
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              placeholder="seu@email.com"
              required
              disabled={isLoading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password" className="form-label">
              Senha
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="••••••••"
              required
              disabled={isLoading}
            />
          </div>

          <button
            type="submit"
            className="login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              "Entrar"
            )}
          </button>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <button
            type="button"
            className="google-button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            ) : (
              <>
                <svg
                  viewBox="0 0 24 24"
                  className="google-icon"
                  fill="currentColor"
                >
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Entrar com Google
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#" className="login-link">
            Esqueceu sua senha?
          </a>
          <span className="login-divider">•</span>
          <a href="#" className="login-link">
            Criar conta
          </a>
        </div>
      </div>

      <style jsx>{`
        .login-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(
            135deg,
            rgba(18, 18, 40, 0.98) 0%,
            rgba(26, 20, 48, 0.95) 100%
          );
          padding: 20px;
          position: relative;
        }

        .login-container::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(
            circle at 20% 50%,
            rgba(124, 92, 255, 0.1) 0%,
            transparent 50%
          ),
            radial-gradient(
              circle at 80% 80%,
              rgba(57, 208, 255, 0.1) 0%,
              transparent 50%
            );
          pointer-events: none;
        }

        .login-card {
          background: linear-gradient(
            145deg,
            rgba(30, 30, 60, 0.95) 0%,
            rgba(24, 24, 48, 0.9) 100%
          );
          border: 1px solid rgba(124, 92, 255, 0.2);
          border-radius: 24px;
          padding: 48px;
          width: 100%;
          max-width: 520px;
          box-shadow: 
            0 20px 40px rgba(0, 0, 0, 0.4),
            0 0 60px rgba(124, 92, 255, 0.1);
          backdrop-filter: blur(12px);
          position: relative;
          z-index: 1;
        }

        .login-header {
          text-align: center;
          margin-bottom: 32px;
        }

        .login-logo-full {
          display: block;
          width: auto;
          max-width: min(380px, 92vw);
          height: auto;
          max-height: 96px;
          margin: 0 auto 20px;
          object-fit: contain;
        }

        .login-subtitle {
          font-size: 0.9rem;
          color: rgba(240, 244, 255, 0.6);
          margin: 0;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(240, 244, 255, 0.7);
        }

        .form-input {
          background: rgba(16, 16, 32, 0.6);
          border: 1px solid rgba(124, 92, 255, 0.2);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 0.95rem;
          color: #ffffff;
          transition: all 0.3s ease;
        }

        .form-input::placeholder {
          color: rgba(240, 244, 255, 0.4);
        }

        .form-input:focus {
          outline: none;
          border-color: rgba(124, 92, 255, 0.5);
          box-shadow: 0 0 0 3px rgba(124, 92, 255, 0.1);
        }

        .form-input:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .login-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 8px;
          padding: 12px;
          font-size: 0.85rem;
          color: rgba(248, 180, 180, 0.9);
          text-align: center;
        }

        .login-button {
          background: linear-gradient(
            135deg,
            rgba(124, 92, 255, 0.8) 0%,
            rgba(57, 208, 255, 0.7) 100%
          );
          border: 1px solid rgba(124, 92, 255, 0.3);
          border-radius: 12px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-top: 8px;
          position: relative;
          overflow: hidden;
        }

        .login-button:hover:not(:disabled) {
          background: linear-gradient(
            135deg,
            rgba(124, 92, 255, 0.9) 0%,
            rgba(57, 208, 255, 0.8) 100%
          );
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(124, 92, 255, 0.3);
        }

        .login-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .login-divider {
          display: flex;
          align-items: center;
          margin: 20px 0;
          color: rgba(240, 244, 255, 0.4);
          font-size: 0.85rem;
        }

        .login-divider::before,
        .login-divider::after {
          content: "";
          flex: 1;
          height: 1px;
          background: rgba(124, 92, 255, 0.2);
        }

        .login-divider span {
          padding: 0 16px;
        }

        .google-button {
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 14px;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }

        .google-button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.15);
          border-color: rgba(255, 255, 255, 0.3);
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
        }

        .google-button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
          transform: none;
        }

        .google-icon {
          width: 20px;
          height: 20px;
        }

        .loading-spinner {
          display: flex;
          align-items: center;
          justify-content: center;
        }

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

        .login-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px solid rgba(124, 92, 255, 0.1);
        }

        .login-link {
          font-size: 0.85rem;
          color: rgba(124, 92, 255, 0.8);
          text-decoration: none;
          transition: color 0.3s ease;
        }

        .login-link:hover {
          color: rgba(124, 92, 255, 1);
        }

        .login-divider {
          color: rgba(240, 244, 255, 0.4);
        }

        @media (max-width: 480px) {
          .login-card {
            padding: 32px 24px;
          }

          .login-title {
            font-size: 1.3rem;
          }
        }
      `}</style>
    </div>
  );
}
