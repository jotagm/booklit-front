import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarClubePorId, deletarClube } from "../api/clubes";
import { buscarMembroPorUsuarioEClube, listarMembrosPorClube, removerMembro } from "../api/membros";
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
import FeedAtividade from "../components/FeedAtividade";
import RoleBadge from "../components/RoleBadge";
import Modal from "../components/Modal";
import LinkDeConvite from "../components/LinkDeConvite";
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
  const [confirmandoSaida, setConfirmandoSaida] = useState(false);
  const [saindo, setSaindo] = useState(false);
  const [removendo, setRemovendo] = useState<UsuarioClubeResponse | null>(null);

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

  async function sairDoClube() {
    if (!meuMembro) return;
    setSaindo(true);
    try {
      await removerMembro(meuMembro.id);
      navigate("/clubes", { replace: true });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível sair do clube."));
      setSaindo(false);
      setConfirmandoSaida(false);
    }
  }

  async function confirmarRemocao() {
    if (!removendo) return;
    try {
      await removerMembro(removendo.id);
      setMembros((prev) => prev.filter((m) => m.id !== removendo.id));
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível remover o membro."));
    } finally {
      setRemovendo(null);
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
        <section className="mb-6">
          <FeedAtividade clubeId={clubeId} limite={15} titulo="atividade do clube" mostrarClube={false} />
        </section>

        <section>
          <h2 className="mb-2 font-serif text-lg text-ink-900">membros ({membros.length})</h2>
          <ul className="card divide-y divide-ink-800/10">
            {membros.map((m) => (
              <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                <Link to={`/leitores/${m.usuarioId}`} className="flex flex-1 items-center gap-3 hover:opacity-80">
                  <Avatar nome={m.nomeUsuario} usuarioId={m.usuarioId} size="sm" />
                  <span className="text-sm text-ink-900">{m.nomeUsuario}</span>
                </Link>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-500">
                  {m.papel === "LIDER" ? "líder" : "membro"}
                </span>
                {souLider && m.papel !== "LIDER" && (
                  <button
                    onClick={() => setRemovendo(m)}
                    className="text-xs text-muted-500 hover:text-red-600"
                    aria-label={`remover ${m.nomeUsuario}`}
                  >
                    remover
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        {/* Link de convite (só líder) */}
        {souLider && (
          <section>
            <h2 className="mb-2 font-serif text-lg text-ink-900">chamar gente para o clube</h2>
            <LinkDeConvite clubeId={clube.id} nomeClube={clube.nome} />
          </section>
        )}

        {/* Convites por e-mail pendentes (só líder) */}
        {souLider && (
          <section>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="font-serif text-lg text-ink-900">convites por e-mail</h2>
              <Link
                to={`/clubes/novo/${clubeId}/convidar`}
                state={{ nomeClube: clube.nome }}
                className="text-sm font-semibold text-brand-600"
              >
                + convidar por e-mail
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

        {/* Membro comum pode sair; o líder precisa transferir a liderança antes */}
        {!souLider && (
          <section className="mt-4 border-t border-ink-800/10 pt-4">
            <button
              onClick={() => setConfirmandoSaida(true)}
              className="text-sm font-semibold text-red-600 hover:underline"
            >
              sair do clube
            </button>
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

      <Modal aberto={confirmandoSaida} onFechar={() => setConfirmandoSaida(false)} titulo="Sair do clube">
        <p className="text-sm text-muted-600">
          Você deixa de ver as leituras e a discussão de <strong>{clube.nome}</strong>. Para voltar, vai
          precisar de um novo convite.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setConfirmandoSaida(false)}>
            ficar
          </Button>
          <Button fullWidth variant="danger" loading={saindo} onClick={sairDoClube}>
            sair
          </Button>
        </div>
      </Modal>

      <Modal aberto={removendo !== null} onFechar={() => setRemovendo(null)} titulo="Remover membro">
        <p className="text-sm text-muted-600">
          Remover <strong>{removendo?.nomeUsuario}</strong> do clube? A pessoa só volta com um novo convite.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setRemovendo(null)}>
            cancelar
          </Button>
          <Button fullWidth variant="danger" onClick={confirmarRemocao}>
            remover
          </Button>
        </div>
      </Modal>

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
