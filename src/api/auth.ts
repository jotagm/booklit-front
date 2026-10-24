import { api } from "./client";
import type { LoginRequest, LoginResponse, UsuarioRequest, UsuarioResponse } from "./types";

/** Segunda etapa do login: confere o código enviado por e-mail e devolve o token. */
export async function concluirLogin(desafioId: string, codigo: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login/codigo", { desafioId, codigo });
  return data;
}

export async function login(dados: LoginRequest): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/login", dados);
  return data;
}

export async function criarConta(dados: UsuarioRequest): Promise<UsuarioResponse> {
  const { data } = await api.post<UsuarioResponse>("/usuarios", dados);
  return data;
}
