import { api } from "./client";
import type { LoginInput } from "@/lib/validations/auth";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export async function loginUser(credentials: LoginInput): Promise<LoginResponse> {
  return api.post<LoginResponse>("/auth/login", credentials);
}

export async function getMe(): Promise<AuthUser> {
  return api.get<AuthUser>("/auth/me");
}

export async function logoutUser(): Promise<void> {
  return api.post<void>("/auth/logout", {});
}
