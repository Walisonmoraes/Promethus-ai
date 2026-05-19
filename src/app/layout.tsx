import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";
import AuthGuard from "@/components/AuthGuard";
import AuthSessionProvider from "@/components/SessionProvider";

const display = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
});

const sans = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "Prometheus AI",
  description: "Lancamentos financeiros por conversa, simples como um chat.",
  icons: {
    icon: "/icon.png",
    shortcut: "/icon.png",
    apple: "/icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css"
        />
      </head>
      <body className={`${display.variable} ${sans.variable}`}>
        <AuthSessionProvider>
          <AuthGuard>{children}</AuthGuard>
        </AuthSessionProvider>
      </body>
    </html>
  );
}
