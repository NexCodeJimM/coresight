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
  role: "admin" | "staff";
  is_admin: boolean;
  profile_picture?: string;
}

export const authOptions: NextAuthOptions = {
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
          throw new Error("Please enter your email and password");
        }

        try {
          console.log("Attempting to authenticate:", credentials.email);
          const [rows] = await pool.query<UserRow[]>(
            "SELECT * FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = rows[0];
          console.log("User found:", user ? "Yes" : "No");

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          console.log("Password valid:", isPasswordValid);

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            role: user.role,
            is_admin: Boolean(user.is_admin),
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
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.is_admin = user.is_admin;

        try {
          await pool.query(
            `UPDATE users 
             SET last_login = CONVERT_TZ(NOW(), @@session.time_zone, '+00:00')
             WHERE id = ?`,
            [user.id]
          );
        } catch (error) {
          console.error("Error updating last login:", error);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role;
        session.user.id = token.id;
        session.user.is_admin = token.is_admin;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: true,
};
