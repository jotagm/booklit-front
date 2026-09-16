import { api } from "./client";
import type { UsuarioClubeRequest, UsuarioClubeResponse, UUID } from "./types";

export async function buscarMembroPorId(id: UUID): Promise<UsuarioClubeResponse> {
  const { data } = await api.get<UsuarioClubeResponse>(`/membros/${id}`);
  return data;
}

// Lista os clubes (com papel) de um usuário — é a base da tela "meus clubes".
export async function listarMembrosPorUsuario(usuarioId: UUID): Promise<UsuarioClubeResponse[]> {
  const { data } = await api.get<UsuarioClubeResponse[]>(`/membros/usuario/${usuarioId}`);
  return data;
}

export async function listarMembrosPorClube(clubeId: UUID): Promise<UsuarioClubeResponse[]> {
  const { data } = await api.get<UsuarioClubeResponse[]>(`/membros/clube/${clubeId}`);
  return data;
}

export async function buscarMembroPorUsuarioEClube(
  usuarioId: UUID,
  clubeId: UUID
): Promise<UsuarioClubeResponse | null> {
  try {
    const { data } = await api.get<UsuarioClubeResponse>(`/membros/clube/${clubeId}/usuario/${usuarioId}`);
    return data;
  } catch {
    return null;
  }
}

export async function atualizarPapelMembro(
  id: UUID,
  dados: UsuarioClubeRequest
): Promise<UsuarioClubeResponse> {
  const { data } = await api.put<UsuarioClubeResponse>(`/membros/${id}`, dados);
  return data;
}

export async function removerMembro(id: UUID): Promise<void> {
  await api.delete(`/membros/${id}`);
}
