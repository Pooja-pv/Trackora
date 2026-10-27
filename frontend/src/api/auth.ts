
import apiClient from "./client";

export interface AuthUser {
  id: number;
  username: string;
  email: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegistrationData {
  username: string;
  email: string;
  full_name: string;
  password: string;
  password_confirmation: string;
}

export async function registerUser(
  data: RegistrationData,
): Promise<AuthUser> {
  const response = await apiClient.post<AuthUser>("auth/register/", data);
  return response.data;
}

export async function loginUser(
  credentials: LoginCredentials,
): Promise<AuthUser> {
  const response = await apiClient.post<AuthUser>(
    "auth/login/",
    credentials,
  );

  return response.data;
}

export async function getCurrentUser(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>("auth/me/");
  return response.data;
}

export async function logoutUser(): Promise<void> {
  await apiClient.post("auth/logout/");
}
