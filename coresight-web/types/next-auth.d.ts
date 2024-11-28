import "next-auth";

declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    is_admin: boolean;
    two_factor_enabled: boolean;
  }

  interface Session {
    user: User & {
      id: string;
      role: string;
      is_admin: boolean;
      two_factor_enabled: boolean;
    };
  }

  interface JWT {
    role: string;
    id: string;
    is_admin: boolean;
    two_factor_enabled: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    id: string;
    is_admin: boolean;
    two_factor_enabled: boolean;
  }
} 