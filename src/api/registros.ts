import { api } from "./client";
import type { RegistroResponse, UUID } from "./types";

export async function buscarRegistroPorId(id: UUID): Promise<RegistroResponse> {
  const { data } = await api.get<RegistroResponse>(`/registros/${id}`);
  return data;
}

export async function listarRegistrosPorLeitura(leituraClubeId: UUID): Promise<RegistroResponse[]> {
  const { data } = await api.get<RegistroResponse[]>(`/registros/leitura/${leituraClubeId}`);
  return data;
}

export async function buscarRegistroPorLeituraEUsuario(
  leituraClubeId: UUID,
  usuarioId: UUID
): Promise<RegistroResponse | null> {
  try {
    const { data } = await api.get<RegistroResponse>(
      `/registros/leitura/${leituraClubeId}/usuario/${usuarioId}`
    );
    return data;
  } catch {
    return null;
  }
}

// Atualiza o progresso do usuário autenticado para a leitura informada.
export async function atualizarProgresso(leituraId: UUID, valorAtual: number): Promise<RegistroResponse> {
  const { data } = await api.put<RegistroResponse>(`/registros/leitura/${leituraId}`, { valorAtual });
  return data;
}
