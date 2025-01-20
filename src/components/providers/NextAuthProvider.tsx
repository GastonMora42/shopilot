// src/components/providers/NextAuthProvider.tsx
'use client'

import { AuthModalProvider } from '@/contexts/AuthModalContext'
import { SessionProvider } from 'next-auth/react'

export function NextAuthProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider>   
    <AuthModalProvider>
  {children}
</AuthModalProvider>
</SessionProvider>
}