import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarClubePorId, deletarClube } from "../api/clubes";
import { buscarMembroPorUsuarioEClube, listarMembrosPorClube } from "../api/membros";
import { buscarLeituraAtiva, listarLeiturasPorClube } from "../api/leituras";
import { listarConvitesPorClube, deletarConvite } from "../api/convites";
import { listarVotacoesPorClube } from "../api/votacoes";
import { listarRegistrosPorLeitura } from "../api/registros";
import { listarVotosPorVotacao } from "../api/votos";
import { marcarClubeVisto } from "../api/feed";
import type {
  ClubeResponse,
  ConviteResponse,
  LeituraClubeResponse,
  RegistroResponse,
  UsuarioClubeResponse,
  VotacaoResponse,
  VotoResponse,
} from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import Button from "../components/Button";
import Avatar from "../components/Avatar";
import FeedAtividade from "../components/FeedAtividade";
import RoleBadge from "../components/RoleBadge";
import Modal from "../components/Modal";
import LinkDeConvite from "../components/LinkDeConvite";
import BookCover from "../components/BookCover";
import FacePile from "../components/FacePile";
import PistaDoGrupo from "../components/PistaDoGrupo";
import { corPorId, plural } from "../utils/cores";
import {
  DIAS_SEM_REGISTRO,
  diasAte,
  formatarData,
  formatarDiaMes,
  formatarMesAno,
  nomeDoDiaSemana,
  paraDate,
  rotuloPrazo,
} from "../utils/date";

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
  const [registros, setRegistros] = useState<RegistroResponse[]>([]);
  const [votos, setVotos] = useState<VotoResponse[]>([]);
  const [aba, setAba] = useState<"atividade" | "membros" | "anteriores" | "sobre">("atividade");
  const [anteriores, setAnteriores] = useState<LeituraClubeResponse[] | null>(null);

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
      const aberta = votacoesResp.find((v) => v.status === "ABERTA") ?? null;
      setVotacaoAberta(aberta);

      // A pista e o "quem falta votar" vêm dos registros e votos que a API já expõe.
      const [regs, vts] = await Promise.all([
        leituraResp ? listarRegistrosPorLeitura(leituraResp.id).catch(() => []) : Promise.resolve([]),
        aberta ? listarVotosPorVotacao(aberta.id).catch(() => []) : Promise.resolve([]),
      ]);
      setRegistros(regs);
      setVotos(vts);

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

  // Leituras anteriores só são buscadas quando a aba é aberta.
  useEffect(() => {
    if (aba !== "anteriores" || anteriores !== null || !clubeId) return;
    const agora = new Date();
    listarLeiturasPorClube(clubeId)
      .then((todas) =>
        setAnteriores(
          todas.filter((l) => l.id !== leituraAtiva?.id && (paraDate(l.dataInicio) ?? agora) <= agora)
        )
      )
      .catch(() => setAnteriores([]));
  }, [aba, anteriores, clubeId, leituraAtiva]);

  // Abrir o clube zera o ponto de novidade dele (na sidebar e nos cartões da home).
  useEffect(() => {
    if (clubeId) marcarClubeVisto(clubeId).catch(() => {});
  }, [clubeId]);

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
  const cor = corPorId(clube.id);
  const pessoas = membros.map((m) => ({ usuarioId: m.usuarioId, nome: m.nomeUsuario, fotoUrl: m.fotoUrl }));
  // Mesma regra do ClubCard: quem atualizou nos últimos DIAS_SEM_REGISTRO dias está no ritmo.
  const noRitmo = registros.filter((r) => -(diasAte(r.updatedAt) ?? -99) < DIAS_SEM_REGISTRO).length;
  const votaram = new Set(votos.map((v) => v.usuarioId));
  const faltam = membros.filter((m) => !votaram.has(m.usuarioId)).map((m) => m.nomeUsuario.trim().split(/\s+/)[0]);
  const minhaPagina = registros.find((r) => r.usuarioId === usuario?.id)?.valorAtual ?? 0;

  return (
    <div className="pb-10">
      <div className="text-cream-50" style={{ backgroundColor: cor }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 pb-5 pt-5 lg:flex-row lg:items-end lg:gap-6 lg:px-10 lg:py-7">
          <div className="flex flex-1 flex-col gap-2.5">
            <div className="flex items-center justify-between text-sm lg:block">
              <Link to="/clubes" className="text-cream-50/85 hover:text-cream-50">
                ← clubes
              </Link>
              <span className="lg:hidden">
                <RoleBadge papel={meuMembro.papel} />
              </span>
            </div>
            <h1 className="font-serif text-[26px] leading-tight lg:text-4xl">{clube.nome}</h1>
            {clube.descricao && <p className="hidden text-sm text-cream-50/90 lg:block">{clube.descricao}</p>}
            {clube.temas.length > 0 && (
              <div className="hidden flex-wrap gap-1.5 lg:flex">
                {clube.temas.map((t) => (
                  <span key={t.id} className="rounded-full bg-cream-50/15 px-2.5 py-0.5 text-[11px]">
                    {t.nome}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2.5 lg:flex-col lg:items-end">
            <FacePile pessoas={pessoas} max={5} tamanho={28} anel={cor} />
            <span className="text-[13px]">
              {plural(membros.length, "membro", "membros")}
              {leituraAtiva && ` · ${noRitmo} no ritmo`}
            </span>
            {souLider && (
              <button
                onClick={() => setAba("sobre")}
                className="hidden rounded-full bg-cream-50 px-4 py-2 text-[13px] font-semibold text-ink-800 hover:bg-cream-100 lg:block"
              >
                convidar
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-6xl px-4 pt-4 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start lg:gap-7 lg:px-10 lg:pt-6">
        <aside className="flex flex-col gap-3.5 lg:sticky lg:top-8 lg:order-2">
          {erro && <ErrorBanner mensagem={erro} />}

          {leituraAtiva ? (
            <div className="card flex flex-col gap-3.5 p-4">
              <div className="flex items-center gap-3">
                <BookCover url={leituraAtiva.livroCapaUrl} titulo={leituraAtiva.livroTitulo} size="md" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">leitura da vez</p>
                  <p className="font-serif text-lg leading-tight text-ink-900">{leituraAtiva.livroTitulo}</p>
                  <p className="text-xs text-muted-500">
                    até {formatarDiaMes(leituraAtiva.dataFim)} · faltam {rotuloPrazo(diasAte(leituraAtiva.dataFim))}
                  </p>
                </div>
              </div>
              {registros.length > 0 && (
                <PistaDoGrupo registros={registros} meta={leituraAtiva.valorMeta} meuUsuarioId={usuario?.id ?? null} />
              )}
              <Link to={`/leituras/${leituraAtiva.id}`} className="flex justify-between text-xs text-muted-600">
                <span>
                  você está na {leituraAtiva.tipoMeta === "PAGINA" ? "pág." : "cap."} {minhaPagina}
                </span>
                <span className="font-semibold text-brand-600">abrir leitura →</span>
              </Link>
            </div>
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

          {votacaoAberta ? (
            <Link
              to={`/votacoes/${votacaoAberta.id}`}
              className="flex flex-col gap-2 rounded-xl2 bg-brand-50 px-4 py-3.5 transition-opacity hover:opacity-90"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-brand-700">
                  🗳 próximo livro · fecha {nomeDoDiaSemana(votacaoAberta.dataEncerramento)}
                </span>
                <span className="chip-forte">votar</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-brand-700">
                <FacePile pessoas={pessoas.filter((p) => votaram.has(p.usuarioId))} tamanho={18} anel="#FBEEE2" max={4} />
                <span>
                  {votaram.size} de {membros.length} votaram
                  {faltam.length > 0 &&
                    ` · faltam ${faltam.slice(0, 2).join(" e ")}${faltam.length > 2 ? ` e +${faltam.length - 2}` : ""}`}
                </span>
              </div>
            </Link>
          ) : (
            souLider && (
              <Link
                to={`/clubes/${clubeId}/votacoes/nova`}
                className="rounded-xl2 border-[1.5px] border-dashed border-ink-800/25 p-3.5 text-center text-sm font-semibold text-brand-600 hover:bg-ink-800/[0.03]"
              >
                + abrir votação do próximo livro
              </Link>
            )
          )}
        </aside>

        <main className="mt-5 lg:order-1 lg:mt-0">
          <div className="flex gap-5 border-b border-ink-800/[0.12] text-sm" role="tablist">
            {(["atividade", "membros", "anteriores", "sobre"] as const).map((a) => (
              <button
                key={a}
                role="tab"
                aria-selected={aba === a}
                onClick={() => setAba(a)}
                className={`-mb-px whitespace-nowrap pb-2 ${
                  aba === a ? "border-b-2 border-brand-500 font-semibold text-ink-900" : "text-muted-500 hover:text-ink-800"
                }`}
              >
                {/* no celular "leituras anteriores" não cabe ao lado das outras três abas */}
                {a === "anteriores" ? (
                  <>
                    <span className="lg:hidden">anteriores</span>
                    <span className="hidden lg:inline">leituras anteriores</span>
                  </>
                ) : (
                  a
                )}
              </button>
            ))}
          </div>

          <div className="pt-4">
            {aba === "atividade" && (
              <FeedAtividade clubeId={clubeId} limite={15} titulo="" mostrarClube={false} meuUsuarioId={usuario?.id ?? null} />
            )}

            {aba === "anteriores" &&
              (anteriores === null ? (
                <Spinner />
              ) : anteriores.length === 0 ? (
                <p className="text-sm text-muted-500">nenhuma leitura anterior ainda</p>
              ) : (
                <ul className="flex flex-col gap-3">
                  {anteriores.map((l) => (
                    <li key={l.id}>
                      <Link
                        to={`/leituras/${l.id}`}
                        className="card flex items-center gap-3.5 px-4 py-3.5 transition-shadow hover:shadow-md"
                      >
                        <BookCover url={l.livroCapaUrl} titulo={l.livroTitulo} size="md" />
                        <div className="min-w-0">
                          <p className="font-serif text-[17px] leading-tight text-ink-900">{l.livroTitulo}</p>
                          <p className="mt-1 text-xs text-muted-500">
                            {l.livroAutor && <>{l.livroAutor} · </>}
                            {formatarMesAno(l.dataInicio)} – {formatarMesAno(l.dataFim)}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}

            {aba === "membros" && (
              <ul className="card divide-y divide-ink-800/10">
                {membros.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-3">
                    <Link to={`/leitores/${m.usuarioId}`} className="flex flex-1 items-center gap-3 hover:opacity-80">
                      <Avatar nome={m.nomeUsuario} usuarioId={m.usuarioId} fotoUrl={m.fotoUrl} size="sm" />
                      <span className="text-sm text-ink-900">{m.nomeUsuario}</span>
                    </Link>
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-500">
                      {m.papel === "LIDER" ? "líder" : "membro"}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            {aba === "sobre" && (
              <div className="flex flex-col gap-6">
                <section>
                  <h2 className="section-label">sobre</h2>
                  <p className="text-sm text-ink-800">{clube.descricao || "Este clube ainda não tem descrição."}</p>
                  {clube.temas.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {clube.temas.map((t) => (
                        <span key={t.id} className="chip-neutro">
                          {t.nome}
                        </span>
                      ))}
                    </div>
                  )}
                </section>

                {/* Convidar (só líder): link compartilhável + convites por e-mail pendentes */}
                {souLider && clubeId && (
                  <section>
                    <h2 className="section-label">convidar</h2>
                    <LinkDeConvite clubeId={clubeId} nomeClube={clube.nome} />

                    <div className="mb-2 mt-4 flex items-center justify-between">
                      <h3 className="section-label mb-0">convites por e-mail</h3>
                      <Link
                        to={`/clubes/novo/${clubeId}/convidar`}
                        state={{ nomeClube: clube.nome }}
                        className="text-sm font-semibold text-brand-600"
                      >
                        + por e-mail
                      </Link>
                    </div>
                    {convites.length === 0 ? (
                      <p className="text-sm text-muted-600">nenhum convite por e-mail pendente.</p>
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
                  <section className="border-t border-ink-800/10 pt-4">
                    <button
                      onClick={() => setConfirmandoExclusao(true)}
                      className="text-sm font-semibold text-red-600 hover:underline"
                    >
                      excluir clube
                    </button>
                  </section>
                )}
              </div>
            )}
          </div>
        </main>
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
