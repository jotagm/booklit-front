import { api } from "./client";
import type {
  CampoDeBusca,
  GoogleBooksResponse,
  LeituraClubeRequest,
  LeituraClubeResponse,
  UUID,
} from "./types";

export async function criarLeitura(dados: LeituraClubeRequest): Promise<LeituraClubeResponse> {
  const { data } = await api.post<LeituraClubeResponse>("/leituras", dados);
  return data;
}

export async function buscarLeituraPorId(id: UUID): Promise<LeituraClubeResponse> {
  const { data } = await api.get<LeituraClubeResponse>(`/leituras/${id}`);
  return data;
}

export async function listarLeiturasPorClube(clubeId: UUID): Promise<LeituraClubeResponse[]> {
  const { data } = await api.get<LeituraClubeResponse[]>(`/leituras/clube/${clubeId}`);
  return data;
}

export async function atualizarLeitura(id: UUID, dados: LeituraClubeRequest): Promise<LeituraClubeResponse> {
  const { data } = await api.put<LeituraClubeResponse>(`/leituras/${id}`, dados);
  return data;
}

export async function deletarLeitura(id: UUID): Promise<void> {
  await api.delete(`/leituras/${id}`);
}

// A leitura é "ativa" quando dataInicio <= agora <= dataFim (derivado no backend, sem status persistido).
export async function buscarLeituraAtiva(clubeId: UUID): Promise<LeituraClubeResponse | null> {
  try {
    const { data } = await api.get<LeituraClubeResponse>(`/leituras/clube/${clubeId}/leitura-ativa`);
    return data;
  } catch {
    return null;
  }
}

export interface BuscaDeLivros {
  // Onde procurar: o backend traduz para os operadores intitle:/inauthor:/isbn:.
  campo?: CampoDeBusca;
  // Vira o langRestrict do Google Books. Sem ele a busca disputa relevância com o catálogo
  // inteiro e as edições em inglês dominam: "Duna" não traz a edição brasileira.
  idioma?: string;
  page?: number;
  size?: number;
}

export async function buscarLivrosGoogle(
  termo: string,
  { campo = "TUDO", idioma, page = 0, size = 10 }: BuscaDeLivros = {}
): Promise<GoogleBooksResponse> {
  const { data } = await api.get<GoogleBooksResponse>("/leituras/livros/buscar", {
    params: { termo, campo, page, size, ...(idioma ? { idioma } : {}) },
  });
  return data;
}
