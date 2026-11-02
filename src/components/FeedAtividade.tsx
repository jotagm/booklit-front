import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { listarFeed, reagir, removerReacao } from "../api/feed";
import type { FeedItemResponse, TipoReacao, UUID } from "../api/types";
import Avatar from "./Avatar";
import BookCover from "./BookCover";
import ProgressBar from "./ProgressBar";
import { tempoRelativo } from "../utils/date";

const REACOES: { tipo: TipoReacao; emoji: string; rotulo: string }[] = [
  { tipo: "CURTIR", emoji: "❤️", rotulo: "curtir" },
  { tipo: "FOGO", emoji: "🔥", rotulo: "fogo" },
  { tipo: "PALMAS", emoji: "👏", rotulo: "palmas" },
];

function destinoDe(item: FeedItemResponse): string | null {
  switch (item.tipo) {
    case "PROGRESSO":
    case "CONCLUIU":
    case "COMENTARIO":
    case "LEITURA_INICIADA":
      return item.leituraId ? `/leituras/${item.leituraId}` : null;
    case "VOTACAO_ABERTA":
    case "VOTACAO_ENCERRADA":
      return `/clubes/${item.clubeId}`;
    case "MEMBRO_ENTROU":
      return item.usuarioId ? `/leitores/${item.usuarioId}` : null;
  }
}

function Frase({ item }: { item: FeedItemResponse }) {
  const quem = item.ehVoce ? "Você" : (item.usuarioNome ?? "").split(" ")[0];
  const livro = <strong>{item.livroTitulo}</strong>;
  const unidade = item.unidade === "capítulos" ? "capítulo" : "página";
  switch (item.tipo) {
    case "PROGRESSO":
      return (
        <>
          <strong>{quem}</strong> chegou no {unidade} {item.valorAtual} de {item.valorMeta} de {livro}
        </>
      );
    case "CONCLUIU":
      return (
        <>
          <strong>{quem}</strong> terminou {livro} 🎉
        </>
      );
    case "COMENTARIO":
      return (
        <>
          <strong>{quem}</strong> comentou em {livro}
        </>
      );
    case "LEITURA_INICIADA":
      return <>Nova leitura: {livro}</>;
    case "VOTACAO_ABERTA":
      return (
        <>
          <strong>Votação aberta</strong> — escolham o próximo livro
        </>
      );
    case "VOTACAO_ENCERRADA":
      return (
        <>
          <strong>Votação encerrada</strong> — o próximo livro foi escolhido
        </>
      );
    case "MEMBRO_ENTROU":
      return (
        <>
          <strong>{quem}</strong> entrou no clube
        </>
      );
  }
}

/** Reação otimista: ajusta as contagens na hora; o servidor confirma (ou o item volta ao que era). */
function comReacao(item: FeedItemResponse, nova: TipoReacao | null): FeedItemResponse {
  const reacoes = { ...item.reacoes };
  const antiga = item.minhaReacao;
  if (antiga) {
    const restante = (reacoes[antiga] ?? 1) - 1;
    if (restante <= 0) delete reacoes[antiga];
    else reacoes[antiga] = restante;
  }
  if (nova) reacoes[nova] = (reacoes[nova] ?? 0) + 1;
  return { ...item, reacoes, minhaReacao: nova };
}

export default function FeedAtividade({
  clubeId,
  limite = 20,
  titulo = "atividade dos seus clubes",
  mostrarClube = true,
  onItens,
}: {
  clubeId?: UUID;
  limite?: number;
  titulo?: string;
  mostrarClube?: boolean;
  /** Recebe os itens carregados (a home deriva "lendo agora" deles sem buscar de novo). */
  onItens?: (itens: FeedItemResponse[]) => void;
}) {
  const [itens, setItens] = useState<FeedItemResponse[]>([]);
  const [erroReacao, setErroReacao] = useState(false);
  // Em ref para o efeito de carga não depender da identidade do callback.
  const onItensRef = useRef(onItens);
  onItensRef.current = onItens;

  useEffect(() => {
    listarFeed(clubeId, limite)
      .then((r) => {
        setItens(r);
        onItensRef.current?.(r);
      })
      .catch(() => setItens([]));
  }, [clubeId, limite]);

  const trocar = useCallback((id: string, fn: (i: FeedItemResponse) => FeedItemResponse) => {
    setItens((atual) => atual.map((i) => (i.id === id ? fn(i) : i)));
  }, []);

  async function aoReagir(item: FeedItemResponse, tipo: TipoReacao) {
    setErroReacao(false);
    const desfazer = item.minhaReacao === tipo;
    trocar(item.id, (i) => comReacao(i, desfazer ? null : tipo));
    try {
      const r = desfazer ? await removerReacao(item.id) : await reagir(item.clubeId, item.id, tipo);
      trocar(item.id, (i) => ({ ...i, reacoes: r.reacoes, minhaReacao: r.minhaReacao ?? null }));
    } catch {
      trocar(item.id, () => item);
      setErroReacao(true);
    }
  }

  if (itens.length === 0) return null;

  return (
    <section>
      {titulo && <h2 className="section-label">{titulo}</h2>}
      {erroReacao && <p className="mb-2 text-xs text-red-600">não foi possível reagir agora.</p>}
      <ul className="flex flex-col gap-3">
        {itens.map((item) => {
          const destino = destinoDe(item);
          const celebracao = item.tipo === "CONCLUIU";
          const comCapa = ["PROGRESSO", "CONCLUIU", "LEITURA_INICIADA"].includes(item.tipo) && item.livroTitulo;
          const corpo = (
            <div className="flex gap-3">
              {item.usuarioId && item.usuarioNome ? (
                <Avatar nome={item.usuarioNome} usuarioId={item.usuarioId} fotoUrl={item.usuarioFotoUrl} size="md" />
              ) : (
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base">
                  {item.tipo.startsWith("VOTACAO") ? "🗳" : "📚"}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug text-ink-900">
                  <Frase item={item} />
                </p>
                <p className="mt-0.5 text-xs text-muted-500">
                  {mostrarClube ? `${item.clubeNome} · ` : ""}
                  {tempoRelativo(item.quando)}
                  {/* Em comentário, valorAtual é onde o autor estava ao escrever. */}
                  {item.tipo === "COMENTARIO" && item.valorAtual != null &&
                    ` · ${item.unidade === "capítulos" ? "cap." : "pág."} ${item.valorAtual}`}
                </p>
                {item.tipo === "COMENTARIO" && item.texto && (
                  <p className="mt-2 font-serif text-base leading-relaxed text-ink-900">“{item.texto}”</p>
                )}
                {item.tipo === "PROGRESSO" && item.valorMeta ? (
                  <div className="mt-2">
                    <ProgressBar atual={item.valorAtual ?? 0} meta={item.valorMeta} />
                  </div>
                ) : null}
              </div>
              {comCapa && <BookCover url={item.livroCapaUrl} titulo={item.livroTitulo ?? ""} size="sm" />}
            </div>
          );
          return (
            <li
              key={item.id}
              className={`card px-4 py-3 ${celebracao ? "border-brand-500/40 bg-brand-50/60" : ""}`}
            >
              {destino ? (
                <Link to={destino} className="block hover:opacity-90">
                  {corpo}
                </Link>
              ) : (
                corpo
              )}
              {item.tipo === "MEMBRO_ENTROU" ? (
                <BoasVindas item={item} onAcenar={() => aoReagir(item, "ACENO")} />
              ) : (
                <div className="mt-2.5 flex gap-1.5">
                  {REACOES.map(({ tipo, emoji, rotulo }) => {
                    const total = item.reacoes[tipo] ?? 0;
                    const marcada = item.minhaReacao === tipo;
                    return (
                      <button
                        key={tipo}
                        type="button"
                        onClick={() => aoReagir(item, tipo)}
                        aria-label={rotulo}
                        aria-pressed={marcada}
                        className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-sm transition-colors ${
                          marcada
                            ? "border-brand-500 bg-brand-500/10 text-brand-600"
                            : "border-ink-800/15 text-muted-600 hover:bg-ink-800/[0.04]"
                        }`}
                      >
                        <span>{emoji}</span>
                        {total > 0 && <span className="text-xs font-semibold">{total}</span>}
                      </button>
                    );
                  })}
                  {item.tipo === "COMENTARIO" && item.leituraId && (
                    <Link
                      to={`/leituras/${item.leituraId}`}
                      className="ml-auto self-center text-[13px] font-semibold text-brand-600 hover:text-brand-700"
                    >
                      responder
                    </Link>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/**
 * "Entrou no clube": no lugar das reações, um 👋 de boas-vindas (reação ACENO). Tocar de novo
 * desfaz, como nas outras reações. Quem entrou não acena para si mesmo.
 */
function BoasVindas({ item, onAcenar }: { item: FeedItemResponse; onAcenar: () => void }) {
  const acenos = item.reacoes.ACENO ?? 0;
  const acenei = item.minhaReacao === "ACENO";
  if (item.ehVoce) {
    return acenos > 0 ? <p className="mt-2.5 text-[13px] text-muted-600">👋 {acenos}</p> : null;
  }
  return (
    <div className="mt-2.5 flex items-center gap-2">
      <button
        type="button"
        onClick={onAcenar}
        aria-pressed={acenei}
        className={`rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
          acenei
            ? "border-brand-500/40 bg-brand-50 text-brand-700"
            : "border-ink-800/15 text-ink-800 hover:bg-ink-800/[0.04]"
        }`}
      >
        👋 {acenei ? "boas-vindas enviadas" : "dar boas-vindas"}
      </button>
      {acenos > 0 && <span className="text-[13px] text-muted-600">👋 {acenos}</span>}
    </div>
  );
}
