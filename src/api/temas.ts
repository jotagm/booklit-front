import { api } from "./client";
import type { Page, TemaRequest, TemaResponse, UUID } from "./types";

export async function criarTema(dados: TemaRequest): Promise<TemaResponse> {
  const { data } = await api.post<TemaResponse>("/temas", dados);
  return data;
}

export async function listarTemas(page = 0, size = 50): Promise<Page<TemaResponse>> {
  const { data } = await api.get<Page<TemaResponse>>("/temas", { params: { page, size } });
  return data;
}

export async function buscarTemaPorId(id: UUID): Promise<TemaResponse> {
  const { data } = await api.get<TemaResponse>(`/temas/${id}`);
  return data;
}
