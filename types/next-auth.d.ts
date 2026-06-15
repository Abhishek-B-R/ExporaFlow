import NextAuth, { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      /** True when the user belongs to the primary workspace (accepted invite or owner). */
      workspaceMember?: boolean;
    } & DefaultSession["user"];
  }
}
