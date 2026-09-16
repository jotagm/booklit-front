import { api } from "./client";
import type { OpcaoVotoRequest, OpcaoVotoResponse, UUID } from "./types";

export async function criarOpcaoVoto(dados: OpcaoVotoRequest): Promise<OpcaoVotoResponse> {
  const { data } = await api.post<OpcaoVotoResponse>("/opcoes-voto", dados);
  return data;
}

export async function listarOpcoesPorVotacao(votacaoId: UUID): Promise<OpcaoVotoResponse[]> {
  const { data } = await api.get<OpcaoVotoResponse[]>(`/opcoes-voto/votacao/${votacaoId}`);
  return data;
}

export async function deletarOpcaoVoto(id: UUID): Promise<void> {
  await api.delete(`/opcoes-voto/${id}`);
}
