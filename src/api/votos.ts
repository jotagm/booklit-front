import { api } from "./client";
import type { VotoRequest, VotoResponse, UUID } from "./types";

export async function votar(dados: VotoRequest): Promise<VotoResponse> {
  const { data } = await api.post<VotoResponse>("/votos", dados);
  return data;
}

export async function listarVotosPorVotacao(votacaoId: UUID): Promise<VotoResponse[]> {
  const { data } = await api.get<VotoResponse[]>(`/votos/votacao/${votacaoId}`);
  return data;
}

export async function buscarVotoPorVotacaoEUsuario(
  votacaoId: UUID,
  usuarioId: UUID
): Promise<VotoResponse | null> {
  try {
    const { data } = await api.get<VotoResponse>(`/votos/votacao/${votacaoId}/usuario/${usuarioId}`);
    return data;
  } catch {
    return null;
  }
}

export async function deletarVoto(id: UUID): Promise<void> {
  await api.delete(`/votos/${id}`);
}
