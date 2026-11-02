import { api } from "./client";
import type { FotoEnvioResponse, UsuarioResponse } from "./types";

/** Tipos e limite que o backend aceita (o servidor confere de novo: isto só poupa uma ida e volta). */
export const FOTO_TIPOS = ["image/jpeg", "image/png", "image/webp"] as const;
export const FOTO_TAMANHO_MAXIMO = 2 * 1024 * 1024;

/** Mensagem de erro para uma foto que o backend recusaria; null se estiver tudo certo. */
export function validarFoto(arquivo: File): string | null {
  if (!(FOTO_TIPOS as readonly string[]).includes(arquivo.type)) {
    return "Use uma imagem JPEG, PNG ou WebP.";
  }
  if (arquivo.size > FOTO_TAMANHO_MAXIMO) {
    return "A foto precisa ter até 2 MB.";
  }
  return null;
}

/**
 * Troca a foto de perfil em três passos: pede um envio à API, manda a imagem direto ao S3 e
 * confirma. O PUT no S3 vai com `fetch` de propósito: a instância `api` anexa o token da
 * sessão, e a URL assinada não deve recebê-lo.
 */
export async function trocarFotoDePerfil(arquivo: File): Promise<UsuarioResponse> {
  const { data: envio } = await api.post<FotoEnvioResponse>("/usuarios/me/foto/envio", {
    contentType: arquivo.type,
    tamanho: arquivo.size,
  });

  let resposta: Response;
  try {
    resposta = await fetch(envio.url, { method: "PUT", headers: envio.cabecalhos, body: arquivo });
  } catch {
    throw new Error("Não foi possível enviar a foto. Verifique sua conexão e tente de novo.");
  }
  if (!resposta.ok) {
    throw new Error("O envio da foto foi recusado. Tente de novo com outra imagem.");
  }

  const { data } = await api.put<UsuarioResponse>("/usuarios/me/foto", { chave: envio.chave });
  return data;
}

export async function removerFotoDePerfil(): Promise<UsuarioResponse> {
  const { data } = await api.delete<UsuarioResponse>("/usuarios/me/foto");
  return data;
}
