import { api } from "./client";
import type { UsuarioRequest, UsuarioResponse, UsuarioId, UUID } from "./types";

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
