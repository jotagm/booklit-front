import { api } from "./client";
import type { FeedItemResponse, ReacoesResponse, TipoReacao, UUID } from "./types";

export async function listarFeed(clubeId?: UUID, limite = 40): Promise<FeedItemResponse[]> {
  const { data } = await api.get<FeedItemResponse[]>("/feed", {
    params: { ...(clubeId ? { clubeId } : {}), limite },
  });
  return data;
}

export async function reagir(clubeId: UUID, alvoId: string, tipo: TipoReacao): Promise<ReacoesResponse> {
  const { data } = await api.put<ReacoesResponse>("/reacoes", { clubeId, alvoId, tipo });
  return data;
}

export async function removerReacao(alvoId: string): Promise<ReacoesResponse> {
  const { data } = await api.delete<ReacoesResponse>("/reacoes", { params: { alvoId } });
  return data;
}
