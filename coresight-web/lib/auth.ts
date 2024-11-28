import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import pool from "./db";
import { compare } from "bcrypt";
import { RowDataPacket } from "mysql2";
import { verifyTOTP } from "@epic-web/totp";

interface UserRow extends RowDataPacket {
  id: string;
  email: string;
  password: string;
  username: string;
  role: "admin" | "staff";
  is_admin: boolean;
  profile_picture?: string;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
}

interface CustomUser {
  id: string;
  email: string;
  name: string;
  role: string;
  is_admin: boolean;
  two_factor_enabled: boolean;
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otp: { label: "2FA Code", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please enter your email and password");
        }

        try {
          const [rows] = await pool.query<UserRow[]>(
            "SELECT * FROM users WHERE email = ?",
            [credentials.email]
          );

          const user = rows[0];

          if (!user) {
            throw new Error("No user found with this email");
          }

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Invalid password");
          }

          if (user.two_factor_enabled && !credentials.otp) {
            throw new Error("2FA_REQUIRED");
          }

          if (user.two_factor_enabled && credentials.otp) {
            const isValid = await verifyTOTP({
              secret: user.two_factor_secret!,
              otp: String(credentials.otp),
              window: 1,
            });

            if (!isValid) {
              throw new Error("Invalid 2FA code");
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.username,
            role: user.role,
            is_admin: Boolean(user.is_admin),
            two_factor_enabled: Boolean(user.two_factor_enabled),
          } as CustomUser;
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
        const customUser = user as CustomUser;
        return {
          ...token,
          role: customUser.role,
          id: customUser.id,
          is_admin: customUser.is_admin,
          two_factor_enabled: customUser.two_factor_enabled,
        };
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role,
          is_admin: token.is_admin,
          two_factor_enabled: token.two_factor_enabled,
        },
      };
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  debug: process.env.NODE_ENV === "development",
};
