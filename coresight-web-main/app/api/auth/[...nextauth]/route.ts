import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcrypt";
import { db } from "@/lib/db";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            throw new Error("Email and password required");
          }

          console.log("Attempting login for:", credentials.email);

          const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [
            credentials.email,
          ]);
          console.log("Database response:", rows);

          const user = (rows as any[])[0];

          if (!user) {
            console.log("No user found");
            throw new Error("Invalid credentials");
          }

          console.log("Found user:", { ...user, password: "[REDACTED]" });

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("Invalid password");
            throw new Error("Invalid credentials");
          }

          return {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role as "admin" | "viewer",
            isAdmin: Boolean(user.is_admin),
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.username = user.username;
        token.role = user.role;
        token.isAdmin = user.isAdmin;
      }
      return token;
    },
    async session({ session, token }: { session: Session; token: JWT }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          email: token.email as string,
          username: token.username,
          role: token.role,
          isAdmin: token.isAdmin,
        },
      };
    },
  },
  debug: process.env.DEBUG === "true",
});

export { handler as GET, handler as POST };
