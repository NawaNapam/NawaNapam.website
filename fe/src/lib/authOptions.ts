import GoogleProvider from "next-auth/providers/google";
import InstagramProvider from "next-auth/providers/instagram";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import { prisma } from "./prisma";
import type { User as NextAuthUser } from "next-auth";
import { googleEnv, nextEnv } from "@/envs/e";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: googleEnv.CLIENT_ID!,
      clientSecret: googleEnv.CLIENT_SECRET!,
    }),
    InstagramProvider({
      clientId: process.env.INSTAGRAM_CLIENT_ID,
      clientSecret: process.env.INSTAGRAM_CLIENT_SECRET,
    }),

    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) {
          return null;
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );

        if (!isValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
          username: user.username,
          phoneNumber: user.phoneNumber || undefined,
          gender: user.gender || undefined,
        } as NextAuthUser;
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // On sign in, add ALL user data to token
      if (user) {
        token.id = user.id;
        token.username = user.username;
        token.phoneNumber = user.phoneNumber;
        token.gender = user.gender;
      }

      // On update (if you use session update), refresh from DB
      if (trigger === "update" && token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            username: true,
            name: true,
            email: true,
            image: true,
            phoneNumber: true,
            gender: true,
          },
        });

        if (dbUser) {
          token.username = dbUser.username as string;
          token.name = dbUser.name;
          token.email = dbUser.email;
          token.picture = dbUser.image;
          token.phoneNumber = dbUser.phoneNumber || undefined;
          token.gender = dbUser.gender || undefined;
        }
      }

      // If data is missing but we have an ID, fetch it from DB
      if (
        token.id &&
        (!token.username || !token.phoneNumber || !token.gender)
      ) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            username: true,
            phoneNumber: true,
            gender: true,
          },
        });

        if (dbUser) {
          if (dbUser.username) token.username = dbUser.username;
          if (dbUser.phoneNumber) token.phoneNumber = dbUser.phoneNumber;
          if (dbUser.gender) token.gender = dbUser.gender;
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.username = token.username as string | undefined;
        session.user.phoneNumber = token.phoneNumber as string | undefined;
        session.user.gender = token.gender as "MALE" | "FEMALE" | "OTHER";

        // Fallback: if still missing data, fetch from DB
        if (
          !session.user.username ||
          !session.user.phoneNumber ||
          !session.user.gender
        ) {
          const dbUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
              username: true,
              phoneNumber: true,
              gender: true,
            },
          });

          if (dbUser) {
            if (dbUser.username) session.user.username = dbUser.username;
            if (dbUser.phoneNumber)
              session.user.phoneNumber = dbUser.phoneNumber;
            if (dbUser.gender) session.user.gender = dbUser.gender;
          }
        }
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}/dashboard`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },

  pages: {
    signIn: "/login",
  },
  secret: nextEnv.NA_SECRET,
};
