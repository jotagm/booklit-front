import { api } from "./client";
import type { DesafioOtpResponse, LoginRequest, LoginResponse, UsuarioRequest, UsuarioResponse } from "./types";

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

/**
 * "Esqueci minha senha", primeira etapa: manda o código para o e-mail. A resposta é a mesma
 * exista conta ou não; 429 com Retry-After quando pedido antes de 60 s ou acima de 5 por hora.
 */
export async function esqueciSenha(email: string): Promise<DesafioOtpResponse> {
  const { data } = await api.post<DesafioOtpResponse>("/auth/senha/esqueci", { email });
  return data;
}

/** Segunda etapa: código certo + senha nova. Devolve um token novo (já entra logado). */
export async function redefinirSenha(desafioId: string, codigo: string, novaSenha: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>("/auth/senha/redefinir", { desafioId, codigo, novaSenha });
  return data;
}
