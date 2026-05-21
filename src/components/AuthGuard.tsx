"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const [isLoading, setIsLoading] = useState(true);
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Se já está em uma rota pública, não precisa verificar
    if (pathname === "/" || pathname === "/login") {
      console.log("AuthGuard: Rota pública detectada, permitindo acesso");
      setIsLoading(false);
      return;
    }

    // Se a session está carregando, esperar
    if (status === "loading") {
      console.log("AuthGuard: Session está carregando, aguardando...");
      return;
    }

    console.log("AuthGuard: Status:", status);
    console.log("AuthGuard: Session:", session);
    console.log("AuthGuard: Pathname:", pathname);

    // Se não há session, redirecionar para login
    if (!session) {
      console.log("AuthGuard: Sem session, redirecionando para login");
      router.push("/login");
    } else {
      console.log("AuthGuard: Session encontrada, permitindo acesso");
    }

    setIsLoading(false);
  }, [pathname, session, status, router]);

  // Se está em uma rota pública, renderizar normalmente
  if (pathname === "/" || pathname === "/login") {
    return <>{children}</>;
  }

  // Mostrar loading enquanto verifica autenticação
  if (isLoading || status === "loading") {
    return (
      <div className="loading-screen">
        <div className="loading-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
          </div>
          <p className="loading-text">Carregando...</p>
        </div>
        <style jsx>{`
          .loading-screen {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(
              135deg,
              rgba(18, 18, 40, 0.98) 0%,
              rgba(26, 20, 48, 0.95) 100%
            );
          }

          .loading-content {
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 24px;
          }

          .loading-spinner {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .spinner {
            width: 32px;
            height: 32px;
            border: 3px solid rgba(124, 92, 255, 0.2);
            border-top: 3px solid rgba(124, 92, 255, 0.8);
            border-radius: 50%;
            animation: spin 1s linear infinite;
          }

          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }

          .loading-text {
            font-size: 0.9rem;
            color: rgba(240, 244, 255, 0.6);
            margin: 0;
          }
        `}</style>
      </div>
    );
  }

  // Se não estiver autenticado e não estiver no login, não renderizar nada
  if (!session && pathname !== "/login") {
    return null;
  }

  // Se estiver autenticado, renderizar o conteúdo
  return <>{children}</>;
}
