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
    }
  }

  interface User {
    id: string;
    role: 'ORGANIZER' | 'ADMIN';
    mercadopago?: {
      accessToken?: string;
      userId?: string;
    };
  }
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise, {
    // Optimizar las operaciones de MongoDB
    databaseName: 'showspot',
    collections: {
      Users: 'users',
      Accounts: 'accounts',
      Sessions: 'sessions',
      VerificationTokens: 'verification_tokens',
    },
  }),
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
      // Minimizar los datos en el token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        if (user.mercadopago) {
          token.mercadopago = user.mercadopago;
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Optimizar la sesión para reducir el tamaño de los datos
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as 'ORGANIZER' | 'ADMIN';
        if (token.mercadopago) {
          session.user.mercadopago = token.mercadopago;
        }
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Simplificar la lógica de redirección
      return url.startsWith(baseUrl) ? url : `${baseUrl}/admin`;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 días
    updateAge: 24 * 60 * 60, // 24 horas
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/',
    error: '/error', // Añadir página de error
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  logger: {
    error(code, ...message) {
      console.error(code, message);
    },
    warn(code, ...message) {
      console.warn(code, message);
    },
    debug(code, ...message) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(code, message);
      }
    },
  },
  events: {
    async signIn({ user }) {
      // Logging básico para debugging
      console.log(`User ${user.email} signed in`);
    },
  },
};

export default NextAuth(authOptions);