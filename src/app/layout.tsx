// src/app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { AuthModal } from "@/components/auth/AuthModal";
import { NextAuthProvider } from "@/components/providers/NextAuthProvider";

const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
  display: 'swap',
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
  display: 'swap',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "ShowSpot",
  description: "Venta de tickets Online",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'),
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      translate="no"
      className={`${geistSans.variable} ${geistMono.variable}`}
    >
      <head>
        <meta name="google" content="notranslate" />
        <meta name="application-name" content="Shopilot" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Shopilot" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#ffffff" />
      </head>
      <body
        className="min-h-screen bg-background antialiased"
        style={{ overscrollBehavior: 'none' }}
      >
        <NextAuthProvider>
          {children}
          <AuthModal /> {/* Añadimos el modal aquí para que esté disponible globalmente */}
        </NextAuthProvider>
      </body>
    </html>
  );
}