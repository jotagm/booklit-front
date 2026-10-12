import { api } from "./client";
import type {
  EstanteResumoResponse,
  LeituraPessoalRequest,
  LeituraPessoalResponse,
  StatusLeituraPessoal,
  UUID,
} from "./types";

// Estante pessoal: livros lidos fora (ou além) do clube. Tudo aqui é do usuário
// autenticado — o backend nunca expõe a estante de outra pessoa.

export async function listarEstante(status?: StatusLeituraPessoal): Promise<LeituraPessoalResponse[]> {
  const { data } = await api.get<LeituraPessoalResponse[]>("/estante", {
    params: status ? { status } : undefined,
  });
  return data;
}

export async function adicionarNaEstante(dados: LeituraPessoalRequest): Promise<LeituraPessoalResponse> {
  const { data } = await api.post<LeituraPessoalResponse>("/estante", dados);
  return data;
}

export async function buscarResumoDaEstante(ano?: number): Promise<EstanteResumoResponse> {
  const { data } = await api.get<EstanteResumoResponse>("/estante/resumo", {
    params: ano ? { ano } : undefined,
  });
  return data;
}

export async function definirMetaAnual(ano: number, quantidadeLivros: number): Promise<EstanteResumoResponse> {
  const { data } = await api.put<EstanteResumoResponse>(`/estante/meta/${ano}`, { quantidadeLivros });
  return data;
}

export async function mudarStatusNaEstante(id: UUID, status: StatusLeituraPessoal): Promise<LeituraPessoalResponse> {
  const { data } = await api.put<LeituraPessoalResponse>(`/estante/${id}/status`, { status });
  return data;
}

export async function atualizarProgressoNaEstante(
  id: UUID,
  paginaAtual: number,
  totalPaginas?: number | null
): Promise<LeituraPessoalResponse> {
  const { data } = await api.put<LeituraPessoalResponse>(`/estante/${id}/progresso`, {
    paginaAtual,
    totalPaginas: totalPaginas ?? null,
  });
  return data;
}

export async function avaliarNaEstante(
  id: UUID,
  nota: number | null,
  resenha: string | null
): Promise<LeituraPessoalResponse> {
  const { data } = await api.put<LeituraPessoalResponse>(`/estante/${id}/avaliacao`, { nota, resenha });
  return data;
}

export async function removerDaEstante(id: UUID): Promise<void> {
  await api.delete(`/estante/${id}`);
}
