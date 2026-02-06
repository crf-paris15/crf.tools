import NextAuth from "next-auth";
import google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@repo/db";

export const { handlers, signIn, signOut, auth } = NextAuth({
  adapter: PrismaAdapter(prisma as any),
  providers: [
    google({
      allowDangerousEmailAccountLinking: true,
    }),
  ],
  session: {
    strategy: "jwt",
  },
  debug: process.env.NODE_ENV === "development",

  callbacks: {
    async signIn({ account, profile }) {
      if (account.provider === "google") {
        // If user is in superadmins env variable, let them sign in

        if (process.env.SUPERADMINS?.split(",").includes(profile.email)) {
          return true;
        } else if (profile.email.endsWith("@croix-rouge.fr")) {
          // If user is in croix-rouge.fr domain, check if they exist in the database and are part of the correct group, if they do, let them sign in

          const userCount = await prisma.user.count({
            where: {
              email: profile.email,
              groupId: {
                in: [2, 3],
              },
            },
          });

          return userCount === 1;
        } else {
          // Otherwise, deny access

          return false;
        }
      }
    },

    async jwt({ token, user, session, trigger }) {
      if (trigger === "update" && session?.name !== token.name) {
        token.name = session.name;
      }

      if (user) {
        return {
          ...token,
          id: user.id,
        };
      }
      return token;
    },

    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
        },
      };
    },

    async authorized({ auth }) {
      return !!auth;
    },
  },

  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/signin",
  },
});
