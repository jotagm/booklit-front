import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarClubePorId, deletarClube } from "../api/clubes";
import { buscarMembroPorUsuarioEClube, listarMembrosPorClube } from "../api/membros";
import { buscarLeituraAtiva } from "../api/leituras";
import { listarConvitesPorClube, deletarConvite } from "../api/convites";
import { listarVotacoesPorClube } from "../api/votacoes";
import type {
  ClubeResponse,
  ConviteResponse,
  LeituraClubeResponse,
  UsuarioClubeResponse,
  VotacaoResponse,
} from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import RoleBadge from "../components/RoleBadge";
import Modal from "../components/Modal";
import { formatarData } from "../utils/date";

export default function ClubDetail() {
  const { clubeId } = useParams<{ clubeId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [clube, setClube] = useState<ClubeResponse | null>(null);
  const [meuMembro, setMeuMembro] = useState<UsuarioClubeResponse | null>(null);
  const [membros, setMembros] = useState<UsuarioClubeResponse[]>([]);
  const [leituraAtiva, setLeituraAtiva] = useState<LeituraClubeResponse | null>(null);
  const [convites, setConvites] = useState<ConviteResponse[]>([]);
  const [votacaoAberta, setVotacaoAberta] = useState<VotacaoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [excluindo, setExcluindo] = useState(false);

  const carregar = useCallback(async () => {
    if (!clubeId || !usuario) return;
    setErro(null);
    try {
      const [clubeResp, meuMembroResp, membrosResp, leituraResp, votacoesResp] = await Promise.all([
        buscarClubePorId(clubeId),
        buscarMembroPorUsuarioEClube(usuario.id, clubeId),
        listarMembrosPorClube(clubeId),
        buscarLeituraAtiva(clubeId),
        listarVotacoesPorClube(clubeId),
      ]);

      setClube(clubeResp);
      setMeuMembro(meuMembroResp);
      setMembros(membrosResp);
      setLeituraAtiva(leituraResp);
      setVotacaoAberta(votacoesResp.find((v) => v.status === "ABERTA") ?? null);

      if (meuMembroResp?.papel === "LIDER") {
        const convitesResp = await listarConvitesPorClube(clubeId);
        setConvites(convitesResp.filter((c) => c.status === "PENDENTE"));
      } else {
        setConvites([]);
      }
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar o clube."));
    } finally {
      setCarregando(false);
    }
  }, [clubeId, usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function cancelarConvite(id: string) {
    try {
      await deletarConvite(id);
      setConvites((prev) => prev.filter((c) => c.id !== id));
    } catch (e) {
      setErro(extrairMensagemErro(e));
    }
  }

  async function excluirClube() {
    if (!clubeId) return;
    setExcluindo(true);
    try {
      await deletarClube(clubeId);
      navigate("/clubes", { replace: true });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível excluir o clube."));
      setExcluindo(false);
    }
  }

  if (carregando) return <Spinner label="carregando clube..." />;
  if (erro && !clube) return <div className="p-4"><ErrorBanner mensagem={erro} /></div>;
  if (!clube) return null;
  if (!meuMembro) {
    return (
      <div className="p-4">
        <ErrorBanner mensagem="Você não é membro deste clube." />
      </div>
    );
  }

  const souLider = meuMembro.papel === "LIDER";

  return (
    <div className="mx-auto w-full max-w-3xl pb-8">
      <div className={`px-4 pb-6 pt-6 text-cream-50 ${souLider ? "bg-brand-500" : "bg-muted-700"}`}>
        <div className="flex items-center justify-between">
          <Link to="/clubes" className="text-sm text-cream-50/80 hover:text-cream-50">
            ← voltar
          </Link>
          <RoleBadge papel={meuMembro.papel} />
        </div>
        <h1 className="mt-3 font-serif text-2xl">{clube.nome}</h1>
        {clube.descricao && <p className="mt-1 text-sm text-cream-50/85">{clube.descricao}</p>}
        {clube.temas.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {clube.temas.map((t) => (
              <span key={t.id} className="rounded-full bg-cream-50/15 px-2.5 py-0.5 text-[11px]">
                {t.nome}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-5 px-4 pt-5">
        {erro && <ErrorBanner mensagem={erro} />}

        {/* Leitura ativa */}
        <section>
          <h2 className="mb-2 font-serif text-lg text-ink-900">leitura atual</h2>
          {leituraAtiva ? (
            <Link to={`/leituras/${leituraAtiva.id}`} className="card block p-4 hover:shadow-md">
              <div className="flex gap-3">
                {leituraAtiva.livroCapaUrl ? (
                  <img
                    src={leituraAtiva.livroCapaUrl}
                    alt={leituraAtiva.livroTitulo}
                    className="h-20 w-14 shrink-0 rounded object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-14 shrink-0 items-center justify-center rounded bg-ink-800/10 text-[10px] text-muted-600">
                    capa
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-ink-900">{leituraAtiva.livroTitulo}</p>
                  <p className="mt-1 text-xs text-muted-600">
                    meta: {leituraAtiva.valorMeta} {leituraAtiva.tipoMeta === "PAGINA" ? "páginas" : "capítulos"}
                  </p>
                  <p className="text-xs text-muted-500">
                    {formatarData(leituraAtiva.dataInicio)} — {formatarData(leituraAtiva.dataFim)}
                  </p>
                  <p className="mt-2 text-sm font-medium text-brand-600">ver progresso e discussão →</p>
                </div>
              </div>
            </Link>
          ) : (
            <EmptyState
              titulo="Nenhuma leitura ativa"
              descricao={
                souLider
                  ? "Comece uma nova leitura ou abra uma votação para o próximo livro."
                  : "O líder ainda não iniciou uma leitura para este clube."
              }
              acao={
                souLider ? (
                  <Link to={`/clubes/${clubeId}/leituras/nova`}>
                    <Button>começar leitura</Button>
                  </Link>
                ) : undefined
              }
            />
          )}
        </section>

        {/* Votação */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-serif text-lg text-ink-900">votação do próximo livro</h2>
            {souLider && !votacaoAberta && (
              <Link to={`/clubes/${clubeId}/votacoes/nova`} className="text-sm font-semibold text-brand-600">
                + abrir votação
              </Link>
            )}
          </div>
          {votacaoAberta ? (
            <Link to={`/votacoes/${votacaoAberta.id}`} className="card block p-4 hover:shadow-md">
              <p className="text-sm font-semibold text-ink-900">votação aberta</p>
              <p className="text-xs text-muted-600">
                encerra em {formatarData(votacaoAberta.dataEncerramento)} · voto do líder vale 2
              </p>
              <p className="mt-2 text-sm font-medium text-brand-600">ver opções e votar →</p>
            </Link>
          ) : (
            <p className="text-sm text-muted-600">nenhuma votação aberta no momento.</p>
          )}
        </section>

        {/* Membros */}
        <section>
          <h2 className="mb-2 font-serif text-lg text-ink-900">membros ({membros.length})</h2>
          <ul className="card divide-y divide-ink-800/10">
            {membros.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar nome={m.nomeUsuario} size="sm" />
                <span className="flex-1 text-sm text-ink-900">{m.nomeUsuario}</span>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-500">
                  {m.papel === "LIDER" ? "líder" : "membro"}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Convites pendentes (só líder) */}
        {souLider && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-lg text-ink-900">convites pendentes</h2>
              <Link
                to={`/clubes/novo/${clubeId}/convidar`}
                state={{ nomeClube: clube.nome }}
                className="text-sm font-semibold text-brand-600"
              >
                + convidar
              </Link>
            </div>
            {convites.length === 0 ? (
              <p className="text-sm text-muted-600">nenhum convite pendente.</p>
            ) : (
              <ul className="card divide-y divide-ink-800/10">
                {convites.map((c) => (
                  <li key={c.id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm text-ink-900">{c.emailDestinatario}</p>
                      <p className="text-xs text-muted-500">expira em {formatarData(c.expiraEm)}</p>
                    </div>
                    <button
                      onClick={() => cancelarConvite(c.id)}
                      className="text-xs font-semibold text-red-600 hover:underline"
                    >
                      cancelar
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Zona de perigo (só líder) */}
        {souLider && (
          <section className="mt-4 border-t border-ink-800/10 pt-4">
            <button
              onClick={() => setConfirmandoExclusao(true)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              excluir clube
            </button>
          </section>
        )}
      </div>

      <Modal aberto={confirmandoExclusao} onFechar={() => setConfirmandoExclusao(false)} titulo="Excluir clube">
        <p className="text-sm text-muted-600">
          Tem certeza que quer excluir <strong>{clube.nome}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setConfirmandoExclusao(false)}>
            cancelar
          </Button>
          <Button fullWidth variant="danger" loading={excluindo} onClick={excluirClube}>
            excluir
          </Button>
        </div>
      </Modal>
    </div>
  );
}
