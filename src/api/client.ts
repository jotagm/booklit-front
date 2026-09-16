import axios, { AxiosError } from "axios";

// Em dev, o Vite faz proxy de "/api" -> VITE_BACKEND_URL (ver vite.config.ts),
// então o app nunca fala direto com o backend e não sofre com CORS.
// Em produção, defina VITE_API_BASE_URL apontando para a API (com CORS habilitado
// no Spring, ou atrás do mesmo domínio/reverse proxy).
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

export const api = axios.create({
  baseURL,
  headers: { "Content-Type": "application/json" },
});

const TOKEN_KEY = "clube-livro:token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Repassa uma mensagem de erro amigável (o backend devolve { status, mensagem, timestamp }
// via GlobalExceptionHandler para os erros de negócio conhecidos).
export function extrairMensagemErro(erro: unknown, fallback = "Algo deu errado. Tente novamente."): string {
  if (axios.isAxiosError(erro)) {
    const axiosErro = erro as AxiosError<{ mensagem?: string }>;
    const mensagem = axiosErro.response?.data?.mensagem;
    if (mensagem) return mensagem;
    if (axiosErro.response?.status === 401) return "Sessão expirada. Entre novamente.";
    if (axiosErro.response?.status === 403) return "Você não tem permissão para fazer isso.";
    if (axiosErro.response?.status === 404) return "Não encontrado.";
    if (!axiosErro.response) return "Não foi possível conectar ao servidor.";
  }
  return fallback;
}

let onUnauthorized: (() => void) | null = null;
export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);
