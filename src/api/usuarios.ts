import { api } from "./client";
import type { PerfilRequest, PerfilResponse, UsuarioRequest, UsuarioResponse, UsuarioId } from "./types";

// "Quem sou eu": o dono do token.
export async function buscarUsuarioAtual(): Promise<UsuarioResponse> {
  const { data } = await api.get<UsuarioResponse>("/usuarios/me");
  return data;
}

export async function buscarUsuarioPorId(id: UsuarioId): Promise<UsuarioResponse> {
  const { data } = await api.get<UsuarioResponse>(`/usuarios/${id}`);
  return data;
}

export async function buscarUsuarioPorEmail(email: string): Promise<UsuarioResponse> {
  const { data } = await api.get<UsuarioResponse>(`/usuarios/email/${encodeURIComponent(email)}`);
  return data;
}

export async function atualizarUsuario(id: UsuarioId, dados: UsuarioRequest): Promise<UsuarioResponse> {
  const { data } = await api.put<UsuarioResponse>(`/usuarios/${id}`, dados);
  return data;
}

// Perfil de leitor: o próprio ou o de quem divide clube com você (senão, 404).
export async function buscarPerfil(id: UsuarioId): Promise<PerfilResponse> {
  const { data } = await api.get<PerfilResponse>(`/usuarios/${id}/perfil`);
  return data;
}

// Nome e bio, sem senha e sem invalidar o token.
export async function editarPerfil(dados: PerfilRequest): Promise<UsuarioResponse> {
  const { data } = await api.patch<UsuarioResponse>("/usuarios/me/perfil", dados);
  return data;
}
