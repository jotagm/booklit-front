import { api } from "./client";
import type { LeituraClubeResponse, VotacaoRequest, VotacaoResponse, UUID } from "./types";

export async function criarVotacao(dados: VotacaoRequest): Promise<VotacaoResponse> {
  const { data } = await api.post<VotacaoResponse>("/votacoes", dados);
  return data;
}

export async function buscarVotacaoPorId(id: UUID): Promise<VotacaoResponse> {
  const { data } = await api.get<VotacaoResponse>(`/votacoes/${id}`);
  return data;
}

export async function listarVotacoesPorClube(clubeId: UUID): Promise<VotacaoResponse[]> {
  const { data } = await api.get<VotacaoResponse[]>(`/votacoes/clube/${clubeId}`);
  return data;
}

export async function atualizarVotacao(id: UUID, dados: VotacaoRequest): Promise<VotacaoResponse> {
  const { data } = await api.put<VotacaoResponse>(`/votacoes/${id}`, dados);
  return data;
}

export async function deletarVotacao(id: UUID): Promise<void> {
  await api.delete(`/votacoes/${id}`);
}

// Encerra a votação (só o líder): apura os votos (peso do líder conta 2) e cria a
// próxima LeituraClube a partir da opção vencedora.
export async function encerrarVotacao(id: UUID): Promise<LeituraClubeResponse> {
  const { data } = await api.post<LeituraClubeResponse>(`/votacoes/${id}/encerrar`);
  return data;
}
