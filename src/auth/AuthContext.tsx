import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, criarConta as apiCriarConta, concluirLogin as apiConcluirLogin } from "../api/auth";
import { buscarUsuarioAtual, atualizarUsuario as apiAtualizarUsuario, editarPerfil as apiEditarPerfil } from "../api/usuarios";
import { getToken, registerUnauthorizedHandler, setToken } from "../api/client";
import type { DesafioOtpResponse, PerfilRequest, UsuarioRequest, UsuarioResponse } from "../api/types";

/**
 * Resultado de entrar/cadastrar. Com o código por e-mail ligado no backend, a senha certa
 * não loga direto: devolve o desafio e a tela pede o código (ver `confirmarCodigo`).
 */
export type ResultadoEntrada = { etapa: "concluido" } | { etapa: "codigo"; desafio: DesafioOtpResponse };

// A chave é versionada de propósito. Sessões abertas antes da troca do id de usuário
// (UUID -> integer) têm um id que a API não aceita mais; ignorá-las faz o AuthProvider
// cair no logout automático abaixo, em vez de o app disparar erro em toda chamada.
const USER_KEY = "clube-livro:user:v2";

interface AuthContextValue {
  usuario: UsuarioResponse | null;
  carregando: boolean;
  /** Confere a senha. Chamar de novo durante a etapa do código reenvia o código. */
  entrar: (email: string, senha: string) => Promise<ResultadoEntrada>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<ResultadoEntrada>;
  /** Segunda etapa: confere o código do e-mail e abre a sessão. */
  confirmarCodigo: (desafioId: string, codigo: string) => Promise<void>;
  sair: () => void;
  atualizarPerfil: (dados: UsuarioRequest) => Promise<void>;
  /** Nome e bio (o que os outros leitores veem): não pede senha. */
  editarPerfilPublico: (dados: PerfilRequest) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function lerUsuarioSalvo(): UsuarioResponse | null {
  const bruto = localStorage.getItem(USER_KEY);
  if (!bruto) return null;
  try {
    return JSON.parse(bruto) as UsuarioResponse;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<UsuarioResponse | null>(() => lerUsuarioSalvo());
  const [carregando, setCarregando] = useState(false);

  const persistir = useCallback((u: UsuarioResponse | null) => {
    setUsuario(u);
    if (u) localStorage.setItem(USER_KEY, JSON.stringify(u));
    else localStorage.removeItem(USER_KEY);
  }, []);

  const sair = useCallback(() => {
    setToken(null);
    persistir(null);
  }, [persistir]);

  useEffect(() => {
    // Se o backend responder 401 em qualquer chamada, derruba a sessão local.
    registerUnauthorizedHandler(() => sair());
  }, [sair]);

  // Token salvo sem usuário em cache (ex: localStorage parcial): recupera pelo /usuarios/me;
  // se o token não valer mais, o interceptor de 401 derruba a sessão.
  useEffect(() => {
    if (getToken() && !usuario) {
      buscarUsuarioAtual()
        .then(persistir)
        .catch(() => sair());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const abrirSessao = useCallback(
    async (token: string) => {
      setToken(token);
      persistir(await buscarUsuarioAtual());
    },
    [persistir]
  );

  const entrar = useCallback(
    async (email: string, senha: string): Promise<ResultadoEntrada> => {
      setCarregando(true);
      try {
        const resposta = await apiLogin({ email, senha });
        if (resposta.etapa === "CODIGO" && resposta.desafioId && resposta.expiraEm) {
          return { etapa: "codigo", desafio: { desafioId: resposta.desafioId, expiraEm: resposta.expiraEm } };
        }
        if (!resposta.token) throw new Error("Resposta de login sem token");
        await abrirSessao(resposta.token);
        return { etapa: "concluido" };
      } finally {
        setCarregando(false);
      }
    },
    [abrirSessao]
  );

  const confirmarCodigo = useCallback(
    async (desafioId: string, codigo: string) => {
      const { token } = await apiConcluirLogin(desafioId, codigo);
      if (!token) throw new Error("Resposta sem token");
      await abrirSessao(token);
    },
    [abrirSessao]
  );

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string): Promise<ResultadoEntrada> => {
      setCarregando(true);
      try {
        await apiCriarConta({ nome, email, senha });
        // O primeiro login com código é o que confirma o e-mail da conta nova.
        return await entrar(email, senha);
      } finally {
        setCarregando(false);
      }
    },
    [entrar]
  );

  const atualizarPerfil = useCallback(
    async (dados: UsuarioRequest) => {
      if (!usuario) return;
      const atualizado = await apiAtualizarUsuario(usuario.id, dados);
      persistir(atualizado);
    },
    [usuario, persistir]
  );

  const editarPerfilPublico = useCallback(
    async (dados: PerfilRequest) => {
      persistir(await apiEditarPerfil(dados));
    },
    [persistir]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, carregando, entrar, cadastrar, confirmarCodigo, sair, atualizarPerfil, editarPerfilPublico }),
    [usuario, carregando, entrar, cadastrar, confirmarCodigo, sair, atualizarPerfil, editarPerfilPublico]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
