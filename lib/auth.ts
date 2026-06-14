import NextAuth from "next-auth";
import GithubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { Role } from "@prisma/client";
import { NextAuthOptions } from "next-auth";
import { customToast } from "./custom-toast";
import { prisma } from "@/db";
import { defaultUsername } from "@/lib/default-username";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // to add custom logic whenever user signin
      return true;
    },
    async session({ session, token, user }) {
      // adding user.id to session
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
    // signOut: '/auth/signout',
    // error: '/auth/error',
    // verifyRequest: '/auth/verify-request',
    // newUser: '/auth/new-user' // New users will be directed here when they sign up
  },
  events: {
    createUser: async ({ user }) => {
      if (!user?.id) return;

      try {
        const existing = await prisma.user.findUnique({
          where: { id: user.id },
          select: { username: true },
        });
        if (!existing?.username?.trim()) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              username: defaultUsername({
                id: user.id,
                email: user.email,
                name: user.name,
              }),
            },
          });
        }

        const workspaceName =
          (user.name?.split(" ")[0] ? `${user.name.split(" ")[0]}'s Workspace` : null) ??
          "My Workspace";

        await prisma.$transaction(async (tx) => {
          const workspace = await tx.workspace.create({
            data: {
              name: workspaceName,
              members: {
                create: {
                  userId: user.id,
                  role: Role.ADMIN,
                },
              },
              teams: {
                create: {
                  name: "Core Team",
                  members: {
                    create: {
                      userId: user.id,
                      role: Role.ADMIN,
                    },
                  },
                },
              },
            },
          });

          // No-op: workspace exists now. Keep this hook for future onboarding.
          return workspace.id;
        });
      } catch {
        // Best-effort onboarding; auth should still succeed.
      }
    },
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
