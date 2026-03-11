import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope:
            "openid email profile https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events",
          access_type: "offline",
          prompt: "consent",
        },
      },
      allowDangerousEmailAccountLinking: true,
    }),

    CredentialsProvider({
      id: "phone-otp",
      name: "Phone",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        code:  { label: "Code",  type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.phone || !credentials?.code) return null;

        const phone = credentials.phone.replace(/\D/g, "");

        // Find a valid, unused OTP
        const token = await prisma.otpToken.findFirst({
          where: {
            phone,
            code: credentials.code,
            used: false,
            expiresAt: { gt: new Date() },
          },
          orderBy: { createdAt: "desc" },
        });

        if (!token) return null;

        // Consume the token
        await prisma.otpToken.update({
          where: { id: token.id },
          data: { used: true },
        });

        // Find or create the user by phone
        let user = await prisma.user.findFirst({ where: { phone } });
        if (!user) {
          user = await prisma.user.create({
            data: { phone, onboarded: false },
          });
        }

        return { id: user.id, name: user.name ?? null, email: user.email ?? null };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // `user` is only present on the first sign-in
      if (user) token.userId = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session as any).userId = (token.userId as string) ?? token.sub;
      }
      return session;
    },
  },
};
