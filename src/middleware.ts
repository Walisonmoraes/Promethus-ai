import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// Rotas públicas que não precisam de autenticação
const publicRoutes = [
  "/",
  "/login", 
  "/api/auth/login", 
  "/api/auth/callback/google", 
  "/api/auth/signin",
  "/api/auth/signout",
  "/api/auth/error",
  "/api/auth/session",
  "/api/auth/providers",
  "/api/auth/csrf"
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Se for rota pública, permitir acesso
  if (
    pathname === "/" ||
    publicRoutes
      .filter((route) => route !== "/")
      .some(route => pathname.startsWith(route))
  ) {
    return NextResponse.next();
  }

  // Verificar se há uma sessão NextAuth válida
  const token = await getToken({ 
    req: request, 
    secret: process.env.NEXTAUTH_SECRET 
  });

  if (!token) {
    // Redirecionar para login se não tiver sessão
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Sessão válida, permitir acesso
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - login page
     * - auth API routes (including NextAuth)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$|login|api/auth).*)",
  ],
};
