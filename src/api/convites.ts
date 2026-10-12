import { api } from "./client";
import type {
  ClubeResponse,
  ConviteLinkResponse,
  ConvitePreviewResponse,
  ConviteRequest,
  ConviteResponse,
  UUID,
} from "./types";

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

// ---- convite por link ----
// O líder compartilha booklit.bio/convite/<codigo> (no grupo do WhatsApp, por exemplo);
// quem abre vê a prévia pública do clube e entra com um clique depois de logar.

export async function buscarLinkDeConvite(clubeId: UUID): Promise<ConviteLinkResponse> {
  const { data } = await api.get<ConviteLinkResponse>(`/clubes/${clubeId}/convite-link`);
  return data;
}

export async function regenerarLinkDeConvite(clubeId: UUID): Promise<ConviteLinkResponse> {
  const { data } = await api.post<ConviteLinkResponse>(`/clubes/${clubeId}/convite-link/regenerar`);
  return data;
}

export async function buscarPreviaDoConvite(codigo: string): Promise<ConvitePreviewResponse> {
  const { data } = await api.get<ConvitePreviewResponse>(`/convites/link/${encodeURIComponent(codigo)}`);
  return data;
}

export async function entrarPorLink(codigo: string): Promise<ClubeResponse> {
  const { data } = await api.post<ClubeResponse>(`/convites/link/${encodeURIComponent(codigo)}/entrar`);
  return data;
}

export async function listarMeusConvites(): Promise<ConviteResponse[]> {
  const { data } = await api.get<ConviteResponse[]>("/convites/meus");
  return data;
}
