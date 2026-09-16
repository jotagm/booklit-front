import { api } from "./client";
import type { ComentarioAtualizarRequest, ComentarioRequest, ComentarioResponse, UUID } from "./types";

export async function criarComentario(
  leituraId: UUID,
  dados: ComentarioRequest
): Promise<ComentarioResponse> {
  const { data } = await api.post<ComentarioResponse>(`/leituras/${leituraId}/comentarios`, dados);
  return data;
}

// Retorna a árvore já montada pelo backend (raízes com até 1 nível de respostas).
export async function listarComentariosPorLeitura(leituraId: UUID): Promise<ComentarioResponse[]> {
  const { data } = await api.get<ComentarioResponse[]>(`/leituras/${leituraId}/comentarios`);
  return data;
}

export async function editarComentario(
  id: UUID,
  dados: ComentarioAtualizarRequest
): Promise<ComentarioResponse> {
  const { data } = await api.put<ComentarioResponse>(`/comentarios/${id}`, dados);
  return data;
}

export async function deletarComentario(id: UUID): Promise<void> {
  await api.delete(`/comentarios/${id}`);
}
