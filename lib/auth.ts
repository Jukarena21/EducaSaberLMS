import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "./prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.NEXTAUTH_SECRET || "38a9e82d4f38033786ecf90716dae010634e1cd3058bda8ec3bab7ec519bc557",
  // Configuración para soportar múltiples dominios (Vercel y dominio personalizado)
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: process.env.NODE_ENV === 'production' 
        ? `__Secure-next-auth.session-token`
        : `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        // Permitir cookies en ambos dominios
        domain: process.env.NODE_ENV === 'production' ? undefined : undefined, // undefined permite cookies en cualquier dominio del mismo sitio
      },
    },
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log('[Auth] Missing credentials');
            return null;
          }

          console.log('[Auth] Attempting login for:', credentials.email);

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email
            }
          });

          if (!user) {
            console.log('[Auth] User not found:', credentials.email);
            return null;
          }

          console.log('[Auth] User found:', {
            id: user.id,
            email: user.email,
            role: user.role,
            hashLength: user.passwordHash?.length
          });

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          console.log('[Auth] Password validation result:', isPasswordValid);

          if (!isPasswordValid) {
            console.log('[Auth] Invalid password for:', credentials.email);
            return null;
          }

          console.log('[Auth] Login successful for:', credentials.email);
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            schoolId: user.schoolId
          };
        } catch (error) {
          console.error('[Auth] Error during authorization:', error);
          return null;
        }
      }
    })
  ],
  session: {
    strategy: "jwt"
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.schoolId = user.schoolId;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!;
        session.user.role = token.role as string;
        session.user.schoolId = token.schoolId as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup"
  }
}; 