import "next-auth";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      username: string;
      role: "admin" | "viewer";
      isAdmin: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    id: string;
    email: string;
    username: string;
    role: "admin" | "viewer";
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    email: string;
    username: string;
    role: "admin" | "viewer";
    isAdmin: boolean;
  }
}
