import axios from "axios";
import { api } from "./client";
import type { DesafioOtpResponse, FinalidadeOtp, OtpVerificadoResponse } from "./types";

// Código de 6 dígitos por e-mail (auth-core no booklit-server). Regras do backend:
// vale 10 minutos, aceita 5 tentativas, uso único, e só pode ser reenviado a cada 60 s
// (máximo 5 por hora) por e-mail e finalidade. A resposta do pedido é a mesma exista
// conta ou não para o e-mail.

export async function solicitarCodigo(email: string, finalidade: FinalidadeOtp): Promise<DesafioOtpResponse> {
  const { data } = await api.post<DesafioOtpResponse>("/auth/otp/email", { email, finalidade });
  return data;
}

/** Lança erro (401) se o código estiver errado, expirado ou já usado; a mensagem vem do backend. */
export async function verificarCodigo(
  desafioId: string,
  finalidade: FinalidadeOtp,
  codigo: string
): Promise<OtpVerificadoResponse> {
  const { data } = await api.post<OtpVerificadoResponse>("/auth/otp/email/verificacao", {
    desafioId,
    finalidade,
    codigo,
  });
  return data;
}

/** Segundos do cabeçalho Retry-After de um 429, ou null se o erro for outro. */
export function segundosParaReenviar(erro: unknown): number | null {
  if (!axios.isAxiosError(erro) || erro.response?.status !== 429) return null;
  const valor = Number(erro.response.headers["retry-after"]);
  return Number.isFinite(valor) && valor > 0 ? Math.ceil(valor) : 60;
}
