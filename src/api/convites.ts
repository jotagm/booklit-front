import { api } from "./client";
import type { ConviteRequest, ConviteResponse, UUID } from "./types";

export async function criarConvite(dados: ConviteRequest): Promise<ConviteResponse> {
  const { data } = await api.post<ConviteResponse>("/convites", dados);
  return data;
}

export async function buscarConvitePorId(id: UUID): Promise<ConviteResponse> {
  const { data } = await api.get<ConviteResponse>(`/convites/${id}`);
  return data;
}

export async function buscarConvitePorEmail(email: string): Promise<ConviteResponse> {
  const { data } = await api.get<ConviteResponse>(`/convites/email/${encodeURIComponent(email)}`);
  return data;
}

export async function listarConvitesPorClube(clubeId: UUID): Promise<ConviteResponse[]> {
  const { data } = await api.get<ConviteResponse[]>(`/convites/clube/${clubeId}`);
  return data;
}

export async function aceitarConvite(id: UUID): Promise<ConviteResponse> {
  const { data } = await api.put<ConviteResponse>(`/convites/${id}/aceitar`);
  return data;
}

export async function recusarConvite(id: UUID): Promise<ConviteResponse> {
  const { data } = await api.put<ConviteResponse>(`/convites/${id}/recusado`);
  return data;
}

export async function deletarConvite(id: UUID): Promise<void> {
  await api.delete(`/convites/${id}`);
}
