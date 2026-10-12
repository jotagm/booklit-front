import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, criarConta as apiCriarConta } from "../api/auth";
import { buscarUsuarioAtual, atualizarUsuario as apiAtualizarUsuario, editarPerfil as apiEditarPerfil } from "../api/usuarios";
import { getToken, registerUnauthorizedHandler, setToken } from "../api/client";
import type { PerfilRequest, UsuarioRequest, UsuarioResponse } from "../api/types";

// A chave é versionada de propósito. Sessões abertas antes da troca do id de usuário
// (UUID -> integer) têm um id que a API não aceita mais; ignorá-las faz o AuthProvider
// cair no logout automático abaixo, em vez de o app disparar erro em toda chamada.
const USER_KEY = "clube-livro:user:v2";

interface AuthContextValue {
  usuario: UsuarioResponse | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
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

  // Se existir token salvo mas nenhum usuário em cache (ex: localStorage parcial),
  // não há endpoint de "quem sou eu" — então exige novo login nesse caso raro.
  useEffect(() => {
    if (getToken() && !usuario) {
      sair();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const entrar = useCallback(
    async (email: string, senha: string) => {
      setCarregando(true);
      try {
        const { token } = await apiLogin({ email, senha });
        setToken(token);
        const dadosUsuario = await buscarUsuarioAtual();
        persistir(dadosUsuario);
      } finally {
        setCarregando(false);
      }
    },
    [persistir]
  );

  const cadastrar = useCallback(
    async (nome: string, email: string, senha: string) => {
      setCarregando(true);
      try {
        await apiCriarConta({ nome, email, senha });
        await entrar(email, senha);
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
      // O e-mail é o subject do JWT: trocá-lo invalida o token atual. Como o formulário
      // já tem a senha, reautentica na hora em vez de derrubar a sessão no próximo request.
      if (atualizado.email !== usuario.email) {
        const { token } = await apiLogin({ email: atualizado.email, senha: dados.senha });
        setToken(token);
      }
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
    () => ({ usuario, carregando, entrar, cadastrar, sair, atualizarPerfil, editarPerfilPublico }),
    [usuario, carregando, entrar, cadastrar, sair, atualizarPerfil, editarPerfilPublico]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
