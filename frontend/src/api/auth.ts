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
