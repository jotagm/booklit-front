import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarLeituraPorId } from "../api/leituras";
import { listarRegistrosPorLeitura, atualizarProgresso } from "../api/registros";
import { buscarMembroPorUsuarioEClube, listarMembrosPorClube } from "../api/membros";
import {
  criarComentario,
  editarComentario,
  deletarComentario,
  listarComentariosPorLeitura,
} from "../api/comentarios";
import type { ComentarioResponse, LeituraClubeResponse, RegistroResponse, UsuarioClubeResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import ProgressBar from "../components/ProgressBar";
import Avatar from "../components/Avatar";
import BookCover from "../components/BookCover";
import CommentThread from "../components/CommentThread";
import TrilhaDaLeitura from "../components/TrilhaDaLeitura";
import StepperProgresso from "../components/StepperProgresso";
import PistaDoGrupo, { resumoDaPista } from "../components/PistaDoGrupo";
import { formatarData } from "../utils/date";

function contarComentarios(arvore: ComentarioResponse[]): number {
  return arvore.reduce((n, c) => n + 1 + contarComentarios(c.respostas ?? []), 0);
}

const achatar = (arvore: ComentarioResponse[]): ComentarioResponse[] =>
  arvore.flatMap((c) => [c, ...achatar(c.respostas ?? [])]);

const primeiro = (nome: string) => nome.trim().split(/\s+/)[0];

export default function LeituraDetail() {
  const { leituraId } = useParams<{ leituraId: string }>();
  const { usuario } = useAuth();

  const [leitura, setLeitura] = useState<LeituraClubeResponse | null>(null);
  const [registros, setRegistros] = useState<RegistroResponse[]>([]);
  const [souLider, setSouLider] = useState(false);
  const [comentarios, setComentarios] = useState<ComentarioResponse[]>([]);
  const [membros, setMembros] = useState<UsuarioClubeResponse[]>([]);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [revelarTodos, setRevelarTodos] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!leituraId || !usuario) return;
    setErro(null);
    try {
      const leituraResp = await buscarLeituraPorId(leituraId);
      const [registrosResp, meuMembro, comentariosResp, membrosResp] = await Promise.all([
        listarRegistrosPorLeitura(leituraId),
        buscarMembroPorUsuarioEClube(usuario.id, leituraResp.clubeId),
        listarComentariosPorLeitura(leituraId),
        listarMembrosPorClube(leituraResp.clubeId).catch(() => [] as UsuarioClubeResponse[]),
      ]);

      setLeitura(leituraResp);
      setRegistros(registrosResp);
      setSouLider(meuMembro?.papel === "LIDER");
      setComentarios(comentariosResp);
      setMembros(membrosResp);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar a leitura."));
    } finally {
      setCarregando(false);
    }
  }, [leituraId, usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  // Estável: o StepperProgresso usa o callback como dependência do debounce.
  const salvar = useCallback(
    async (valor: number) => {
      if (!leituraId) return;
      try {
        const atualizado = await atualizarProgresso(leituraId, valor);
        setRegistros((prev) => [...prev.filter((r) => r.usuarioId !== atualizado.usuarioId), atualizado]);
      } catch (e) {
        setErro(extrairMensagemErro(e, "Não foi possível salvar seu progresso."));
      }
    },
    [leituraId]
  );

  async function enviarComentario(e: FormEvent) {
    e.preventDefault();
    if (!leituraId || !novoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      await criarComentario(leituraId, { conteudo: novoComentario.trim(), comentarioPaiId: null });
      setNovoComentario("");
      const atualizados = await listarComentariosPorLeitura(leituraId);
      setComentarios(atualizados);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível publicar o comentário."));
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function responder(paiId: string, conteudo: string) {
    if (!leituraId) return;
    await criarComentario(leituraId, { conteudo, comentarioPaiId: paiId });
    setComentarios(await listarComentariosPorLeitura(leituraId));
  }

  async function editar(id: string, conteudo: string) {
    if (!leituraId) return;
    await editarComentario(id, { conteudo });
    setComentarios(await listarComentariosPorLeitura(leituraId));
  }

  async function excluir(id: string) {
    if (!leituraId) return;
    await deletarComentario(id);
    setComentarios(await listarComentariosPorLeitura(leituraId));
  }

  if (carregando) return <Spinner label="carregando leitura..." />;
  if (erro && !leitura) return <div className="p-4"><ErrorBanner mensagem={erro} /></div>;
  if (!leitura) return null;

  const meuId = usuario?.id ?? null;
  const meuRegistro = registros.find((r) => r.usuarioId === meuId);
  const minhaPosicao = meuRegistro?.valorAtual ?? 0;
  const unidade = leitura.tipoMeta === "PAGINA" ? "pág." : "cap.";
  const ateA = leitura.tipoMeta === "PAGINA" ? "a pág." : "o cap.";
  const totalComentarios = contarComentarios(comentarios);
  // Há spoiler escondido? (comentário de outra pessoa escrito mais à frente de onde estou)
  const temSpoiler =
    !!meuRegistro &&
    achatar(comentarios).some(
      (c) => !c.removido && c.usuarioId !== meuId && c.paginaAutor != null && c.paginaAutor > minhaPosicao
    );
  const comRegistro = new Set(registros.map((r) => r.usuarioId));
  const naoComecaram = membros.filter((m) => !comRegistro.has(m.usuarioId)).map((m) => primeiro(m.nomeUsuario));

  const cartaoProgresso = (
    <section className="card flex flex-col gap-3 p-4">
      <h2 className="section-label mb-0 hidden lg:block">seu progresso</h2>
      <StepperProgresso valor={minhaPosicao} meta={leitura.valorMeta} unidade={unidade} onSalvar={salvar} />
      {registros.length > 0 && (
        <>
          <PistaDoGrupo registros={registros} meta={leitura.valorMeta} meuUsuarioId={meuId} />
          <p className="text-xs text-muted-600">{resumoDaPista(registros, meuId)}</p>
        </>
      )}
    </section>
  );

  const trilha = <TrilhaDaLeitura leitura={leitura} souLider={souLider} onAtualizada={setLeitura} />;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-28 pt-6 lg:grid lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-7 lg:px-10 lg:pb-0 lg:pt-8">
      <div className="flex flex-col lg:min-h-[calc(100vh-4rem)]">
        <Link to={`/clubes/${leitura.clubeId}`} className="text-sm text-muted-600 hover:text-ink-800">
          ← {leitura.nomeClube}
        </Link>

        {erro && (
          <div className="mt-3">
            <ErrorBanner mensagem={erro} />
          </div>
        )}

        <div className="mt-3 flex items-end gap-4">
          <BookCover
            url={leitura.livroCapaUrl}
            titulo={leitura.livroTitulo}
            size="xl"
            className="shadow-[0_6px_14px_-6px_rgba(43,33,27,.4)]"
          />
          <div className="min-w-0">
            <h1 className="font-serif text-2xl leading-tight text-ink-900 lg:text-[32px]">{leitura.livroTitulo}</h1>
            <p className="mt-1 text-[13px] text-muted-600">
              {leitura.livroAutor && <>{leitura.livroAutor} · </>}até {formatarData(leitura.dataFim)}
            </p>
          </div>
        </div>

        <div className="mt-4 lg:hidden">{cartaoProgresso}</div>

        {/* discussão */}
        <section className="mt-6 flex-1">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 lg:border-b lg:border-ink-800/10 lg:pb-2.5">
            <h2 className="section-label mb-0">
              discussão · {totalComentarios}
              <span className="hidden lg:inline"> {totalComentarios === 1 ? "comentário" : "comentários"}</span>
            </h2>
            {temSpoiler && (
              <p className="text-xs text-muted-500">
                {revelarTodos ? "mostrando tudo · " : `mostrando até ${ateA} ${minhaPosicao} · `}
                <button
                  type="button"
                  onClick={() => setRevelarTodos((v) => !v)}
                  className="font-semibold text-brand-600 hover:text-brand-700"
                >
                  {revelarTodos ? `só até ${ateA} ${minhaPosicao}` : "ver tudo"}
                </button>
              </p>
            )}
          </div>
          {comentarios.length === 0 ? (
            <EmptyState titulo="Nenhum comentário ainda" descricao="Seja o primeiro a comentar sobre esta leitura." />
          ) : (
            <div className="flex flex-col gap-4">
              {comentarios.map((c) => (
                <CommentThread
                  key={c.id}
                  comentario={c}
                  meuUsuarioId={meuId}
                  souLider={souLider}
                  meuProgresso={meuRegistro ? minhaPosicao : null}
                  emCapitulos={leitura.tipoMeta === "CAPITULO"}
                  revelarTodos={revelarTodos}
                  onResponder={responder}
                  onEditar={editar}
                  onExcluir={excluir}
                />
              ))}
            </div>
          )}
        </section>

        <div className="lg:hidden">{trilha}</div>

        {/* composer fixo no rodapé: no mobile fica acima da bottom nav (64px); o pb-28 do
            container impede que cubra o último comentário */}
        {usuario && (
          <form
            onSubmit={enviarComentario}
            className="fixed inset-x-0 bottom-[64px] z-30 flex items-center gap-2 border-t border-ink-800/10 bg-cream-50 px-3 py-2.5 lg:sticky lg:bottom-0 lg:mt-4 lg:bg-cream-200 lg:px-0 lg:py-3.5"
          >
            <Avatar nome={usuario.nome} usuarioId={usuario.id} fotoUrl={usuario.fotoUrl} size="sm" />
            <input
              className="field-input !rounded-full !py-2.5"
              placeholder={`comentar na ${unidade} ${minhaPosicao}…`}
              value={novoComentario}
              onChange={(e) => setNovoComentario(e.target.value)}
            />
            <button
              type="submit"
              disabled={enviandoComentario || !novoComentario.trim()}
              className="shrink-0 text-sm font-semibold text-brand-600 disabled:opacity-50 lg:btn-primary"
            >
              {enviandoComentario ? "…" : "enviar"}
            </button>
          </form>
        )}
      </div>

      <aside className="hidden lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-4 lg:self-start lg:pt-9">
        {cartaoProgresso}

        <section className="card p-4">
          <h2 className="section-label">o grupo</h2>
          <ul>
            {registros
              .slice()
              .sort((a, b) => b.valorAtual - a.valorAtual)
              .map((r) => {
                const eu = r.usuarioId === meuId;
                const terminou = r.valorAtual >= leitura.valorMeta;
                return (
                  <li key={r.id}>
                    <Link to={`/leitores/${r.usuarioId}`} className="flex items-center gap-2.5 py-1.5 hover:opacity-80">
                      <Avatar nome={r.nomeUsuario} usuarioId={r.usuarioId} fotoUrl={r.fotoUrl} size="sm" />
                      <span className={`min-w-0 flex-1 truncate text-sm text-ink-900 ${eu ? "font-semibold" : ""}`}>
                        {eu ? "você" : primeiro(r.nomeUsuario)}
                      </span>
                      {terminou ? (
                        <span className="text-xs font-semibold text-brand-600">terminou 🎉</span>
                      ) : (
                        <>
                          <span className="w-20">
                            <ProgressBar atual={r.valorAtual} meta={leitura.valorMeta} tone={eu ? "brand" : "muted"} />
                          </span>
                          <span className="w-8 text-right text-xs text-muted-500">{r.valorAtual}</span>
                        </>
                      )}
                    </Link>
                  </li>
                );
              })}
            {naoComecaram.length > 0 && (
              <li className="flex items-center gap-2.5 py-1.5 text-xs text-muted-500">
                <span className="h-7 w-7 shrink-0 rounded-full border-2 border-dashed border-ink-800/25" />
                {naoComecaram.length === 1
                  ? `${naoComecaram[0]} ainda não começou`
                  : `${naoComecaram.slice(0, -1).join(", ")} e ${naoComecaram[naoComecaram.length - 1]} ainda não começaram`}
              </li>
            )}
          </ul>
        </section>

        {trilha}
      </aside>
    </div>
  );
}
