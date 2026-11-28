import { api } from "../../lib/api";
import type {
  LoginInput,
  LoginResponse,
  CurrentUserResponse,
  LogoutResponse,
  RegisterInput,
  RegisterResponse,
} from "../../types/auth.types";

export async function login(input: LoginInput) {
  const response = await api.post<LoginResponse>("/auth/login", input);
  return response.data;
}

export async function getCurrentUser() {
  const response = await api.get<CurrentUserResponse>("/auth/me");
  return response.data;
}

export async function logout() {
  const response = await api.post<LogoutResponse>("/auth/logout");
  return response.data;
}

export async function register(input: RegisterInput) {
  const response = await api.post<RegisterResponse>(
    "/auth/register",
    input
  );

  return response.data;
}