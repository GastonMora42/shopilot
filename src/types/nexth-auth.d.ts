// src/types/next-auth.d.ts
import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      mercadopago?: {
        accessToken?: string;
        refreshToken?: string;
        userId?: string;
        publicKey?: string;
      };
      bankAccount?: {
        accountName: string;
        cbu: string;
        bank: string;
        additionalNotes?: string;
      };
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    name: string;
    email: string;
    mercadopago?: {
      accessToken?: string;
      refreshToken?: string;
      userId?: string;
      publicKey?: string;
    };
    bankAccount?: {
      accountName: string;
      cbu: string;
      bank: string;
      additionalNotes?: string;
    };
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    mercadopago?: {
      accessToken?: string;
      refreshToken?: string;
      userId?: string;
      publicKey?: string;
    };
    bankAccount?: {
      accountName: string;
      cbu: string;
      bank: string;
      additionalNotes?: string;
    };
  }
}