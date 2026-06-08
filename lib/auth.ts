import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { createHash } from "crypto";
import { prisma } from "@/lib/db";

function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn:  "/login",
    signOut: "/",
    error:   "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email:    { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const member = await prisma.member.findUnique({
          where: { email: credentials.email },
        });

        if (!member) return null;
        if (member.status === "PENDING") {
          throw new Error("Your membership is pending admin approval.");
        }
        if (member.status === "SUSPENDED") {
          throw new Error("Your account has been suspended.");
        }
        if (member.status === "EXPIRED") {
          throw new Error("Your membership has expired. Please renew.");
        }

        const hash = hashPassword(credentials.password);
        if (hash !== member.passwordHash) return null;

        return {
          id:           member.id,
          email:        member.email,
          name:         member.name,
          membershipId: member.membershipId,
          role:         member.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id           = user.id;
        token.membershipId = (user as any).membershipId;
        token.role         = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id           = token.id;
        (session.user as any).membershipId = token.membershipId;
        (session.user as any).role         = token.role;
      }
      return session;
    },
  },
};
