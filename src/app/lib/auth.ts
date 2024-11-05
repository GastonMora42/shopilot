// lib/auth.ts
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
    }
  }

  interface User {
    role: 'ORGANIZER' | 'ADMIN';
    mercadopago?: {
      accessToken?: string;
      userId?: string;
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
          role: 'ORGANIZER', // Por defecto, todos son organizadores
          verified: true,
        };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
        session.user.mercadopago = user.mercadopago;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
  },
};