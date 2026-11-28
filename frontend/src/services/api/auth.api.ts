
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

// Change password
export type ChangePasswordInput = {
  current_password: string;
  new_password: string;
  confirm_password: string;
};

export type ChangePasswordResponse = {
  success: boolean;
  message: string;
};

export async function changePassword(input: ChangePasswordInput) {
  const response = await api.patch<ChangePasswordResponse>(
    "/auth/change-password",
    input
  );

  return response.data;
}
