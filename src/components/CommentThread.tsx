import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import type { ComentarioResponse, UsuarioId } from "../api/types";
import Avatar from "./Avatar";
import Button from "./Button";
import { formatarDataHora, tempoRelativo } from "../utils/date";
import { reagir, removerReacao } from "../api/feed";

interface Props {
  comentario: ComentarioResponse;
  meuUsuarioId: UsuarioId | null;
  souLider: boolean;
  ehResposta?: boolean;
  /** Onde eu estou na leitura; comentários escritos mais à frente chegam borrados. */
  meuProgresso?: number | null;
  /** Unidade da meta, para o chip ("pág. 25") e o aviso ("20 páginas à frente"). */
  emCapitulos?: boolean;
  /** Clube da leitura: é para ele que vai a reação (❤️) do comentário. */
  clubeId?: string;
  /** "ver tudo" no cabeçalho da discussão: mostra todos os spoilers de uma vez. */
  revelarTodos?: boolean;
  onResponder: (paiId: string, conteudo: string) => Promise<void>;
  onEditar: (id: string, conteudo: string) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
}

export default function CommentThread({
  comentario,
  meuUsuarioId,
  souLider,
  ehResposta = false,
  meuProgresso = null,
  emCapitulos = false,
  revelarTodos = false,
  clubeId,
  onResponder,
  onEditar,
  onExcluir,
}: Props) {
  const [respondendo, setRespondendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoResposta, setTextoResposta] = useState("");
  const [textoEdicao, setTextoEdicao] = useState(comentario.conteudo);
  const [enviando, setEnviando] = useState(false);
  const [revelado, setRevelado] = useState(false);
  // ❤️ do comentário: o alvo é comentario:<id>, o mesmo do feed (reagir lá ou aqui é igual).
  const [curtidas, setCurtidas] = useState(comentario.reacoes?.CURTIR ?? 0);
  const [curti, setCurti] = useState(comentario.minhaReacao === "CURTIR");
  useEffect(() => {
    setCurtidas(comentario.reacoes?.CURTIR ?? 0);
    setCurti(comentario.minhaReacao === "CURTIR");
  }, [comentario.reacoes, comentario.minhaReacao]);

  async function alternarCurtida() {
    if (!clubeId) return;
    const antes = { curtidas, curti };
    const agora = !curti;
    setCurti(agora);
    setCurtidas((n) => Math.max(0, n + (agora ? 1 : -1)));
    try {
      const alvo = `comentario:${comentario.id}`;
      const r = agora ? await reagir(clubeId, alvo, "CURTIR") : await removerReacao(alvo);
      setCurtidas(r.reacoes.CURTIR ?? 0);
      setCurti(r.minhaReacao === "CURTIR");
    } catch {
      setCurtidas(antes.curtidas);
      setCurti(antes.curti);
    }
  }
  // "só até a pág. N" esconde de novo tudo, inclusive o que foi aberto um a um.
  useEffect(() => {
    if (!revelarTodos) setRevelado(false);
  }, [revelarTodos]);

  const souAutor = comentario.usuarioId === meuUsuarioId;
  const possoExcluir = souAutor || souLider;
  const pagina = comentario.removido ? null : comentario.paginaAutor ?? null;
  // Sem página (comentário antigo) ou sem saber onde eu estou, nada é escondido.
  const aFrente = pagina !== null && meuProgresso !== null && !souAutor ? pagina - meuProgresso : 0;
  const escondido = aFrente > 0 && !revelado && !revelarTodos;
  const rotuloUnidade = emCapitulos ? "cap." : "pág.";

  async function enviarResposta(e: FormEvent) {
    e.preventDefault();
    if (!textoResposta.trim()) return;
    setEnviando(true);
    try {
      await onResponder(comentario.id, textoResposta.trim());
      setTextoResposta("");
      setRespondendo(false);
    } finally {
      setEnviando(false);
    }
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!textoEdicao.trim()) return;
    setEnviando(true);
    try {
      await onEditar(comentario.id, textoEdicao.trim());
      setEditando(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={ehResposta ? "ml-9" : ""}>
      <div className="flex gap-3">
        <Avatar nome={comentario.usuarioNome} usuarioId={comentario.usuarioId} fotoUrl={comentario.usuarioFotoUrl} size="sm" />
        <div className="min-w-0 flex-1">
          {/* No desktop o comentário fica num cartão claro e a resposta num balão mais escuro (mock 2d). */}
          <div
            className={
              ehResposta
                ? "rounded-xl bg-ink-800/[0.06] px-3 py-2"
                : "rounded-xl bg-ink-800/[0.04] px-3 py-2 lg:rounded-2xl lg:border lg:border-ink-800/10 lg:bg-cream-50 lg:px-4 lg:py-3"
            }
          >
            {ehResposta ? (
              // Resposta: "Mariana · pág. 40", sem o selo.
              <p className="text-sm text-ink-900">
                <span className="font-semibold">{comentario.usuarioNome.trim().split(/\s+/)[0]}</span>
                {pagina !== null && (
                  <span className="text-muted-600">
                    {" "}
                    · {rotuloUnidade} {pagina}
                  </span>
                )}
              </p>
            ) : (
              <div className="flex items-baseline justify-between gap-2">
                <span className="text-sm font-semibold text-ink-900">{comentario.usuarioNome}</span>
                {pagina !== null && (
                  <span className="shrink-0 rounded-full bg-brand-50 px-2 text-[11px] font-semibold text-brand-600">
                    {rotuloUnidade} {pagina}
                  </span>
                )}
              </div>
            )}

            {editando ? (
              <form onSubmit={salvarEdicao} className="mt-1.5">
                <textarea
                  className="field-input min-h-[60px] resize-none text-sm"
                  value={textoEdicao}
                  onChange={(e) => setTextoEdicao(e.target.value)}
                  autoFocus
                />
                <div className="mt-1.5 flex gap-2">
                  <Button type="submit" loading={enviando} className="!px-3 !py-1.5 text-xs">
                    salvar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => setEditando(false)}
                  >
                    cancelar
                  </Button>
                </div>
              </form>
            ) : escondido ? (
              // Spoiler: o autor estava mais à frente. O texto fica borrado (e fora da seleção
              // e do leitor de tela) até a pessoa pedir para ver.
              <div className="relative mt-0.5">
                <p aria-hidden="true" className="select-none text-sm text-ink-800 blur-[5px]">
                  {comentario.conteudo}
                </p>
                <button
                  type="button"
                  onClick={() => setRevelado(true)}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-ink-900 px-3 py-1 text-xs font-semibold text-cream-50 hover:bg-ink-800"
                >
                  {aFrente} {emCapitulos ? (aFrente === 1 ? "capítulo" : "capítulos") : aFrente === 1 ? "página" : "páginas"} à
                  frente de você · mostrar
                </button>
              </div>
            ) : (
              <p className={`mt-0.5 text-sm ${comentario.removido ? "italic text-muted-500" : "text-ink-800"}`}>
                {comentario.conteudo}
              </p>
            )}
          </div>

          {!comentario.removido && !editando && !escondido && (
            <div className="mt-1 flex items-center gap-3 pl-3 text-xs font-semibold text-muted-500">
              {clubeId && (
                <button
                  type="button"
                  onClick={alternarCurtida}
                  aria-pressed={curti}
                  aria-label="curtir"
                  className={`flex items-center gap-1 ${curti ? "text-brand-600" : "hover:text-brand-600"}`}
                >
                  <span className={curti ? "" : "opacity-60 grayscale"}>❤️</span>
                  {curtidas > 0 && <span>{curtidas}</span>}
                </button>
              )}
              {!ehResposta && (
                <button onClick={() => setRespondendo((v) => !v)} className="hover:text-brand-600">
                  responder
                </button>
              )}
              {souAutor && (
                <button onClick={() => setEditando(true)} className="hover:text-brand-600">
                  editar
                </button>
              )}
              {possoExcluir && (
                <button onClick={() => onExcluir(comentario.id)} className="hover:text-red-600">
                  excluir
                </button>
              )}
              <span className="font-normal" title={formatarDataHora(comentario.createdAt)}>
                {tempoRelativo(comentario.createdAt)}
              </span>
            </div>
          )}

          {respondendo && (
            <form onSubmit={enviarResposta} className="mt-2 flex gap-2">
              <input
                className="field-input text-sm"
                placeholder="escrever uma resposta..."
                value={textoResposta}
                onChange={(e) => setTextoResposta(e.target.value)}
                autoFocus
              />
              <Button type="submit" loading={enviando} className="!px-3 !py-2 text-xs shrink-0">
                enviar
              </Button>
            </form>
          )}

          {comentario.respostas.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {comentario.respostas.map((resposta) => (
                <CommentThread
                  key={resposta.id}
                  comentario={resposta}
                  meuUsuarioId={meuUsuarioId}
                  souLider={souLider}
                  ehResposta
                  meuProgresso={meuProgresso}
                  emCapitulos={emCapitulos}
                  revelarTodos={revelarTodos}
                  clubeId={clubeId}
                  onResponder={onResponder}
                  onEditar={onEditar}
                  onExcluir={onExcluir}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
