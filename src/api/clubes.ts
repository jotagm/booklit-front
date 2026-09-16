import { api } from "./client";
import type { ClubeRequest, ClubeResponse, Page, UUID } from "./types";

export async function criarClube(dados: ClubeRequest): Promise<ClubeResponse> {
  const { data } = await api.post<ClubeResponse>("/clubes", dados);
  return data;
}

export async function listarClubesVisiveis(page = 0, size = 20): Promise<Page<ClubeResponse>> {
  const { data } = await api.get<Page<ClubeResponse>>("/clubes", { params: { page, size } });
  return data;
}

export async function buscarClubePorId(id: UUID): Promise<ClubeResponse> {
  const { data } = await api.get<ClubeResponse>(`/clubes/${id}`);
  return data;
}

export async function atualizarClube(id: UUID, dados: ClubeRequest): Promise<ClubeResponse> {
  const { data } = await api.put<ClubeResponse>(`/clubes/${id}`, dados);
  return data;
}

export async function deletarClube(id: UUID): Promise<void> {
  await api.delete(`/clubes/${id}`);
}
