import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listarMembrosPorUsuario } from "../api/membros";
import { listarLeiturasPorClube } from "../api/leituras";
import { buscarRegistroPorLeituraEUsuario } from "../api/registros";
import Avatar from "../components/Avatar";
import { Spinner } from "../components/Feedback";
import { paraDate, sequenciaDeSemanas } from "../utils/date";

interface Estatisticas {
  clubes: number;
  livros: number;
  semanas: number;
}

const CHAVE_NOTIFICACOES = "clube-livro:notificacoes";

export default function Profile() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<Estatisticas | null>(null);
  const [notificacoes, setNotificacoes] = useState(() => localStorage.getItem(CHAVE_NOTIFICACOES) !== "false");

  const carregarStats = useCallback(async () => {
    if (!usuario) return;
    const membros = await listarMembrosPorUsuario(usuario.id);

    const leiturasPorClube = await Promise.all(
      membros.map((m) => listarLeiturasPorClube(m.clubeId).catch(() => []))
    );
    const todasLeituras = leiturasPorClube.flat();

    const registrosPorLeitura = await Promise.all(
      todasLeituras.map((l) => buscarRegistroPorLeituraEUsuario(l.id, usuario.id))
    );

    // "semanas" é a sequência de semanas com leitura registrada — derivada das datas
    // dos registros, já que o backend não guarda esse contador.
    const datas = registrosPorLeitura
      .map((r) => paraDate(r?.updatedAt))
      .filter((d): d is Date => d !== null);

    setStats({
      clubes: membros.length,
      livros: todasLeituras.length,
      semanas: sequenciaDeSemanas(datas),
    });
  }, [usuario]);

  useEffect(() => {
    carregarStats();
  }, [carregarStats]);

  function alternarNotificacoes() {
    setNotificacoes((prev) => {
      const novo = !prev;
      localStorage.setItem(CHAVE_NOTIFICACOES, String(novo));
      return novo;
    });
  }

  function logout() {
    sair();
    navigate("/", { replace: true });
  }

  if (!usuario) return null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-serif text-[28px] font-bold text-ink-900 lg:text-4xl">perfil</h1>
        <Link to="/perfil/editar" className="text-sm font-semibold text-brand-600 lg:hidden">
          editar
        </Link>
      </div>

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[320px_minmax(0,1fr)] lg:items-start lg:gap-8">
        {/* cartão do usuário */}
        <div className="card flex flex-col items-center px-6 py-7 text-center">
          <Avatar nome={usuario.nome} size="lg" />
          <h2 className="mt-4 font-serif text-xl font-bold text-ink-900">{usuario.nome}</h2>
          <p className="text-sm text-muted-600">{usuario.email}</p>

          <div className="mt-5 w-full border-t border-ink-800/10 pt-4">
            {stats === null ? (
              <Spinner />
            ) : (
              <div className="grid grid-cols-3">
                <Estatistica valor={stats.clubes} rotulo="clubes" />
                <Estatistica valor={stats.livros} rotulo="livros" />
                <Estatistica valor={stats.semanas} rotulo="semanas" destaque />
              </div>
            )}
          </div>

          <button
            onClick={logout}
            className="mt-5 w-full rounded-full border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
          >
            sair da conta
          </button>
        </div>

        {/* conta + preferências */}
        <div className="flex flex-col gap-6">
          <section>
            <h2 className="section-label">conta</h2>
            <div className="card divide-y divide-ink-800/10">
              <Link to="/perfil/editar" className="flex items-center justify-between px-5 py-4 hover:bg-ink-800/[0.03]">
                <div>
                  <p className="text-[15px] text-ink-900">dados pessoais</p>
                  <p className="text-xs text-muted-500">nome e e-mail</p>
                </div>
                <span className="text-muted-400">›</span>
              </Link>
              <Link
                to="/perfil/editar"
                state={{ focoSenha: true }}
                className="flex items-center justify-between px-5 py-4 hover:bg-ink-800/[0.03]"
              >
                <div>
                  <p className="text-[15px] text-ink-900">senha</p>
                  <p className="text-xs text-muted-500">alterar senha</p>
                </div>
                <span className="text-muted-400">›</span>
              </Link>
            </div>
          </section>

          <section>
            <h2 className="section-label">preferências</h2>
            <div className="card flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-[15px] text-ink-900">notificações</p>
                <p className="text-xs text-muted-500">salvo só neste dispositivo</p>
              </div>
              <button
                onClick={alternarNotificacoes}
                className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                  notificacoes ? "bg-brand-500" : "bg-ink-800/15"
                }`}
                aria-pressed={notificacoes}
                aria-label="notificações"
              >
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-50 shadow transition-transform ${
                    notificacoes ? "translate-x-5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function Estatistica({
  valor,
  rotulo,
  destaque = false,
}: {
  valor: number;
  rotulo: string;
  destaque?: boolean;
}) {
  return (
    <div>
      <p className={`font-serif text-2xl ${destaque ? "text-brand-500" : "text-ink-900"}`}>{valor}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-500">{rotulo}</p>
    </div>
  );
}
