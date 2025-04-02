// src/lib/auth.ts
import NextAuth, { NextAuthOptions } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { MongoDBAdapter } from '@next-auth/mongodb-adapter';
import clientPromise from './mongodb-adapter';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      name: string | null;
      email: string | null;
      image: string | null;
      role: 'ORGANIZER' | 'ADMIN';
      mercadopago?: {
        accessToken?: string;
        userId?: string;
      };
      bankAccount?: {
        accountName: string;
        cbu: string;
        bank: string;
        additionalNotes?: string;
      };
    }
  }

  interface User {
    id: string;
    role: 'ORGANIZER' | 'ADMIN';
    mercadopago?: {
      accessToken?: string;
      userId?: string;
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
    role: 'ORGANIZER' | 'ADMIN';
    mercadopago?: {
      accessToken?: string;
      userId?: string;
    };
    bankAccount?: {
      accountName: string;
      cbu: string;
      bank: string;
      additionalNotes?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: 'ORGANIZER',
          verified: true,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.mercadopago = user.mercadopago;
        token.bankAccount = user.bankAccount;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ORGANIZER' | 'ADMIN';
        session.user.mercadopago = token.mercadopago;
        session.user.bankAccount = token.bankAccount;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) {
        return url;
      }
      return `${baseUrl}/admin`;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: '/',
  },
  secret: process.env.NEXTAUTH_SECRET,
};

export default NextAuth(authOptions);