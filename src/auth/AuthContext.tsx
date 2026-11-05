import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import {
  login as apiLogin,
  criarConta as apiCriarConta,
  concluirLogin as apiConcluirLogin,
  redefinirSenha as apiRedefinirSenha,
} from "../api/auth";
import { verificarCodigo } from "../api/otp";
import { removerFotoDePerfil, trocarFotoDePerfil } from "../api/foto";
import {
  buscarUsuarioAtual,
  atualizarUsuario as apiAtualizarUsuario,
  editarPerfil as apiEditarPerfil,
  salvarPreferencias as apiSalvarPreferencias,
} from "../api/usuarios";
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
  /** Cria a conta. Não abre sessão: quem entra é `confirmarCadastro`, depois do código do e-mail. */
  cadastrar: (nome: string, email: string, senha: string) => Promise<void>;
  /** Cadastro: confere o código do e-mail e, se estiver certo, abre a sessão. */
  confirmarCadastro: (desafioId: string, codigo: string) => Promise<void>;
  /** "Esqueci minha senha": código certo troca a senha e já abre a sessão. */
  redefinirSenha: (desafioId: string, codigo: string, novaSenha: string) => Promise<void>;
  /** Segunda etapa: confere o código do e-mail e abre a sessão. */
  confirmarCodigo: (desafioId: string, codigo: string) => Promise<void>;
  sair: () => void;
  atualizarPerfil: (dados: UsuarioRequest) => Promise<void>;
  /** Nome e bio (o que os outros leitores veem): não pede senha. */
  editarPerfilPublico: (dados: PerfilRequest) => Promise<void>;
  /** Envia a imagem ao S3 e passa a usá-la como foto de perfil. */
  trocarFoto: (arquivo: File) => Promise<void>;
  removerFoto: () => Promise<void>;
  /** Preferências da conta (hoje, lembretes por e-mail). */
  salvarPreferencias: (dados: { receberLembretes: boolean }) => Promise<void>;
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
    } else if (getToken()) {
      // A URL da foto é assinada e vale cerca de 1 hora: o usuário guardado no navegador
      // traria um endereço vencido. Falha de rede aqui não derruba a sessão (o 401 já cai no
      // interceptor).
      buscarUsuarioAtual()
        .then(persistir)
        .catch(() => undefined);
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

  // Código só no cadastro: depois de criada, a conta confirma o e-mail com o código e já entra
  // logado. Quem sai e volta entra só com e-mail e senha (o código no login é outra chave do backend).
  const cadastrar = useCallback(async (nome: string, email: string, senha: string): Promise<void> => {
    setCarregando(true);
    try {
      await apiCriarConta({ nome, email, senha });
    } finally {
      setCarregando(false);
    }
  }, []);

  const confirmarCadastro = useCallback(
    async (desafioId: string, codigo: string) => {
      const { token } = await verificarCodigo(desafioId, "VERIFICAR_EMAIL", codigo);
      if (!token) throw new Error("Este e-mail já estava confirmado. Entre com seu e-mail e senha.");
      await abrirSessao(token);
    },
    [abrirSessao]
  );

  const redefinirSenha = useCallback(
    async (desafioId: string, codigo: string, novaSenha: string) => {
      const { token } = await apiRedefinirSenha(desafioId, codigo, novaSenha);
      if (!token) throw new Error("Resposta sem token");
      await abrirSessao(token);
    },
    [abrirSessao]
  );

  const atualizarPerfil = useCallback(
    async (dados: UsuarioRequest) => {
      if (!usuario) return;
      const atualizado = await apiAtualizarUsuario(usuario.id, dados);
      persistir(atualizado);
    },
    [usuario, persistir]
  );

  const salvarPreferencias = useCallback(
    async (dados: { receberLembretes: boolean }) => {
      persistir(await apiSalvarPreferencias(dados));
    },
    [persistir]
  );

  const editarPerfilPublico = useCallback(
    async (dados: PerfilRequest) => {
      persistir(await apiEditarPerfil(dados));
    },
    [persistir]
  );

  const trocarFoto = useCallback(
    async (arquivo: File) => {
      persistir(await trocarFotoDePerfil(arquivo));
    },
    [persistir]
  );

  const removerFoto = useCallback(async () => {
    persistir(await removerFotoDePerfil());
  }, [persistir]);

  const value = useMemo<AuthContextValue>(
    () => ({
      usuario,
      carregando,
      entrar,
      cadastrar,
      confirmarCadastro,
      redefinirSenha,
      confirmarCodigo,
      sair,
      atualizarPerfil,
      editarPerfilPublico,
      trocarFoto,
      removerFoto,
      salvarPreferencias,
    }),
    [
      usuario,
      carregando,
      entrar,
      cadastrar,
      confirmarCadastro,
      redefinirSenha,
      confirmarCodigo,
      sair,
      atualizarPerfil,
      editarPerfilPublico,
      trocarFoto,
      removerFoto,
      salvarPreferencias,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
