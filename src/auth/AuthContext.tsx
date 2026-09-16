import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as apiLogin, criarConta as apiCriarConta } from "../api/auth";
import { buscarUsuarioPorEmail, atualizarUsuario as apiAtualizarUsuario } from "../api/usuarios";
import { getToken, registerUnauthorizedHandler, setToken } from "../api/client";
import type { UsuarioRequest, UsuarioResponse } from "../api/types";

const USER_KEY = "clube-livro:user";

interface AuthContextValue {
  usuario: UsuarioResponse | null;
  carregando: boolean;
  entrar: (email: string, senha: string) => Promise<void>;
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  sair: () => void;
  atualizarPerfil: (dados: UsuarioRequest) => Promise<void>;
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
        const dadosUsuario = await buscarUsuarioPorEmail(email);
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
      persistir(atualizado);
    },
    [usuario, persistir]
  );

  const value = useMemo<AuthContextValue>(
    () => ({ usuario, carregando, entrar, cadastrar, sair, atualizarPerfil }),
    [usuario, carregando, entrar, cadastrar, sair, atualizarPerfil]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
