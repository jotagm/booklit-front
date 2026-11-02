import { api } from "./client";
import type { FeedItemResponse, NovidadeClubeResponse, ReacoesResponse, TipoReacao, UUID } from "./types";

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

// Clubes com atividade depois da última vez que você os abriu (o ponto na lista de clubes).
export async function listarNovidades(): Promise<NovidadeClubeResponse[]> {
  const { data } = await api.get<NovidadeClubeResponse[]>("/feed/novidades");
  return data;
}

// Chamado ao abrir o clube: zera o ponto dele.
export async function marcarClubeVisto(clubeId: UUID): Promise<void> {
  await api.put(`/clubes/${clubeId}/visto`);
}
