import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "./db";
import { compare } from "bcrypt";
import { RowDataPacket } from "mysql2";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  username: string;
  role: string;
  profile_picture?: string;
}

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set");
}

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          console.log("Missing credentials");
          return null;
        }

        try {
          console.log("Attempting login with email:", credentials.email);

          const [rows] = await pool.query<UserRow[]>(
            "SELECT * FROM users WHERE email = ?",
            [credentials.email]
          );

          console.log("Database query result:", rows);

          const user = rows[0];

          if (!user) {
            console.log("No user found with email:", credentials.email);
            return null;
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          console.log("Password validation result:", isPasswordValid);

          if (!isPasswordValid) {
            console.log("Invalid password for user:", credentials.email);
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            role: user.role,
            image: user.profile_picture,
          };
        } catch (error) {
          console.error("Database error:", error);
          return null;
        }
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
};
