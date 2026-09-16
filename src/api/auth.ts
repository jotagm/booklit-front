import { api } from "./client";
import type { LoginRequest, LoginResponse, UsuarioRequest, UsuarioResponse } from "./types";

export async function login(dados: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", dados);
  return data;
}

export async function criarConta(dados: UsuarioRequest): Promise<UsuarioResponse> {
  const { data } = await api.post<UsuarioResponse>("/usuarios", dados);
  return data;
}
