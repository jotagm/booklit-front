import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
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

const primeiroNome = (nome?: string | null) => (nome ?? "").trim().split(/\s+/)[0];

function destinoDe(item: FeedItemResponse): string | null {
  switch (item.tipo) {
    case "PROGRESSO":
    case "CONCLUIU":
    case "COMENTARIO":
    case "LEITURA_INICIADA":
      return item.leituraId ? `/leituras/${item.leituraId}` : null;
    case "OPCAO_SUGERIDA":
      return item.votacaoId ? `/votacoes/${item.votacaoId}` : null;
    case "VOTACAO_ABERTA":
    case "VOTACAO_ENCERRADA":
      return `/clubes/${item.clubeId}`;
    case "MEMBRO_ENTROU":
      return item.usuarioId ? `/leitores/${item.usuarioId}` : null;
  }
}

function Frase({ item }: { item: FeedItemResponse }) {
  const quem = item.ehVoce ? "Você" : primeiroNome(item.usuarioNome);
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
          <strong>{quem}</strong> terminou {livro} 🎉{item.primeiraDoClube && " — primeira do clube!"}
        </>
      );
    case "COMENTARIO":
      return (
        <>
          <strong>{quem}</strong> comentou em {livro}
        </>
      );
    case "OPCAO_SUGERIDA":
      return (
        <>
          <strong>{quem}</strong> sugeriu {livro} para a votação
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

/** "Clube do Café · há 20 min · pág. 96" */
function Detalhes({ item, mostrarClube }: { item: FeedItemResponse; mostrarClube: boolean }) {
  const partes: string[] = [];
  if (mostrarClube) partes.push(item.clubeNome);
  partes.push(tempoRelativo(item.quando));
  // Em comentário, valorAtual é onde o autor estava ao escrever.
  if (item.tipo === "COMENTARIO" && item.valorAtual != null) {
    partes.push(`${item.unidade === "capítulos" ? "cap." : "pág."} ${item.valorAtual}`);
  }
  if (item.tipo === "OPCAO_SUGERIDA" && item.membrosQueremLer) {
    partes.push(`${item.membrosQueremLer} ${item.membrosQueremLer === 1 ? "membro quer" : "membros querem"} ler`);
  }
  return <span className="block text-xs text-muted-500">{partes.join(" · ")}</span>;
}

/** "Ana, Carla e você"; com mais de três, "Ana, Bruno e +3". Você vem por último (o backend já ordena assim). */
function nomesDeQuemReagiu(item: FeedItemResponse, meuUsuarioId: number | null): string | null {
  const nomes = (item.quemReagiu ?? []).map((p) => (p.usuarioId === meuUsuarioId ? "você" : primeiroNome(p.nome)));
  if (nomes.length === 0) return null;
  if (nomes.length > 3) return `${nomes.slice(0, 2).join(", ")} e +${nomes.length - 2}`;
  return nomes.length === 1 ? nomes[0] : `${nomes.slice(0, -1).join(", ")} e ${nomes[nomes.length - 1]}`;
}

/** Reação otimista: ajusta as contagens na hora; o servidor confirma (ou o item volta ao que era). */
function comReacao(item: FeedItemResponse, nova: TipoReacao | null, euId: number | null): FeedItemResponse {
  const reacoes = { ...item.reacoes };
  const antiga = item.minhaReacao;
  if (antiga) {
    const restante = (reacoes[antiga] ?? 1) - 1;
    if (restante <= 0) delete reacoes[antiga];
    else reacoes[antiga] = restante;
  }
  if (nova) reacoes[nova] = (reacoes[nova] ?? 0) + 1;
  // Você sai da lista de quem reagiu ao desfazer e entra (por último) ao reagir.
  let quemReagiu = (item.quemReagiu ?? []).filter((p) => p.usuarioId !== euId);
  if (nova && euId !== null) quemReagiu = [...quemReagiu, { usuarioId: euId, nome: "você" }];
  return { ...item, reacoes, minhaReacao: nova, quemReagiu };
}

export default function FeedAtividade({
  clubeId,
  limite = 20,
  titulo = "atividade dos seus clubes",
  mostrarClube = true,
  meuUsuarioId = null,
  classeDoTitulo = "",
  progressoCompacto = false,
  onItens,
}: {
  clubeId?: UUID;
  limite?: number;
  titulo?: string;
  mostrarClube?: boolean;
  /** Para a lista de quem reagiu ("… e você") acompanhar a reação otimista. */
  meuUsuarioId?: number | null;
  /** Ex.: "lg:hidden" para o rótulo aparecer só no celular. */
  classeDoTitulo?: string;
  /**
   * Home e clube: o progresso de cada um já aparece em destaque no "lendo agora" e na pista da
   * leitura (mocks 1a, 2b e 2c), então no feed ele vira uma linha só, sem o cartão com barra.
   */
  progressoCompacto?: boolean;
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
    trocar(item.id, (i) => comReacao(i, desfazer ? null : tipo, meuUsuarioId));
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
      {titulo && <h2 className={`section-label ${classeDoTitulo}`}>{titulo}</h2>}
      {erroReacao && <p className="mb-2 text-xs text-red-600">não foi possível reagir agora.</p>}
      <ul className="flex flex-col gap-3">
        {itens.map((item) => (
          <li key={item.id}>
            {item.tipo === "PROGRESSO" && progressoCompacto ? (
              <LinhaDeProgresso item={item} mostrarClube={mostrarClube} onReagir={(tipo) => aoReagir(item, tipo)} />
            ) : item.tipo === "MEMBRO_ENTROU" ? (
              <CartaoEntrada item={item} mostrarClube={mostrarClube} onAcenar={() => aoReagir(item, "ACENO")} />
            ) : item.tipo === "CONCLUIU" ? (
              <CartaoConclusao item={item} mostrarClube={mostrarClube} onReagir={(tipo) => aoReagir(item, tipo)} />
            ) : (
              <Cartao
                item={item}
                mostrarClube={mostrarClube}
                meuUsuarioId={meuUsuarioId}
                onReagir={(tipo) => aoReagir(item, tipo)}
              />
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function Cabecalho({ item, mostrarClube, lado }: { item: FeedItemResponse; mostrarClube: boolean; lado?: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      {item.usuarioId && item.usuarioNome ? (
        <Avatar nome={item.usuarioNome} usuarioId={item.usuarioId} fotoUrl={item.usuarioFotoUrl} size="md" />
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-base">
          {item.tipo.startsWith("VOTACAO") ? "🗳" : "📚"}
        </span>
      )}
      <div className="min-w-0 flex-1 text-sm leading-[1.3] text-ink-900">
        <Frase item={item} />
        <Detalhes item={item} mostrarClube={mostrarClube} />
      </div>
      {lado}
    </div>
  );
}

function Cartao({
  item,
  mostrarClube,
  meuUsuarioId,
  onReagir,
}: {
  item: FeedItemResponse;
  mostrarClube: boolean;
  meuUsuarioId: number | null;
  onReagir: (tipo: TipoReacao) => void;
}) {
  const destino = destinoDe(item);
  const celebracao = item.tipo === "CONCLUIU";
  const comCapa =
    ["PROGRESSO", "CONCLUIU", "LEITURA_INICIADA", "OPCAO_SUGERIDA"].includes(item.tipo) && item.livroTitulo;
  const capa = comCapa ? <BookCover url={item.livroCapaUrl} titulo={item.livroTitulo ?? ""} size="sm" /> : null;
  const nomes = nomesDeQuemReagiu(item, meuUsuarioId);

  const conteudo = (
    <div className="flex flex-col gap-2.5">
      <Cabecalho item={item} mostrarClube={mostrarClube} lado={capa} />
      {item.tipo === "COMENTARIO" && item.texto && (
        <p className="font-serif text-lg leading-[1.45] text-ink-900">“{item.texto}”</p>
      )}
      {item.tipo === "PROGRESSO" && item.valorMeta ? (
        <div className="pl-[52px] pr-[52px]">
          <ProgressBar atual={item.valorAtual ?? 0} meta={item.valorMeta} />
        </div>
      ) : null}
    </div>
  );

  return (
    <div
      className={`flex flex-col gap-2.5 rounded-xl2 border px-5 py-4 ${
        celebracao ? "border-brand-500/40 bg-brand-50" : "border-ink-800/10 bg-cream-50"
      }`}
    >
      {destino ? (
        <Link to={destino} className="block hover:opacity-90">
          {conteudo}
        </Link>
      ) : (
        conteudo
      )}

      {item.tipo === "COMENTARIO" && item.ultimaResposta && (
        <Link
          to={destino ?? "#"}
          className="flex items-center gap-2.5 rounded-xl bg-ink-800/[0.04] px-3 py-2.5 text-[13px] text-ink-800 hover:bg-ink-800/[0.06]"
        >
          <Avatar
            nome={item.ultimaResposta.usuarioNome}
            usuarioId={item.ultimaResposta.usuarioId}
            fotoUrl={item.ultimaResposta.usuarioFotoUrl}
            size="sm"
            className="!h-6 !w-6 !text-[0px]"
          />
          <span className="min-w-0">
            <strong className="text-ink-900">{primeiroNome(item.ultimaResposta.usuarioNome)}</strong>{" "}
            {item.ultimaResposta.texto}
          </span>
        </Link>
      )}

      <div className="flex items-center gap-1.5">
        {REACOES.map(({ tipo, emoji, rotulo }) => {
          const total = item.reacoes[tipo] ?? 0;
          const marcada = item.minhaReacao === tipo;
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onReagir(tipo)}
              aria-label={rotulo}
              aria-pressed={marcada}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] transition-colors ${
                marcada
                  ? "border-brand-500 bg-brand-500/10 text-brand-600"
                  : "border-ink-800/15 text-muted-700 hover:bg-ink-800/[0.04]"
              }`}
            >
              <span>{emoji}</span>
              {total > 0 && <strong className="text-xs">{total}</strong>}
            </button>
          );
        })}
        {nomes && <span className="ml-1.5 min-w-0 truncate text-xs text-muted-500">{nomes}</span>}
        <span className="flex-1" />
        {item.tipo === "COMENTARIO" && item.leituraId && (
          <Link
            to={`/leituras/${item.leituraId}`}
            className="shrink-0 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            responder{item.respostas ? ` · ${item.respostas}` : ""}
          </Link>
        )}
        {item.tipo === "OPCAO_SUGERIDA" && item.votacaoAberta && item.votacaoId && (
          <Link
            to={`/votacoes/${item.votacaoId}`}
            className="shrink-0 text-[13px] font-semibold text-brand-600 hover:text-brand-700"
          >
            votar nesse →
          </Link>
        )}
      </div>
    </div>
  );
}

/**
 * "Entrou no clube" em uma linha só, como no mock: no lugar das reações, um 👋 de boas-vindas
 * (reação ACENO) à direita. Tocar de novo desfaz. Quem entrou não acena para si mesmo.
 */
function CartaoEntrada({
  item,
  mostrarClube,
  onAcenar,
}: {
  item: FeedItemResponse;
  mostrarClube: boolean;
  onAcenar: () => void;
}) {
  const acenos = item.reacoes.ACENO ?? 0;
  const acenei = item.minhaReacao === "ACENO";
  const destino = destinoDe(item);

  const lado = item.ehVoce ? (
    acenos > 0 ? <span className="shrink-0 text-[13px] text-muted-600">👋 {acenos}</span> : null
  ) : (
    <button
      type="button"
      onClick={onAcenar}
      aria-pressed={acenei}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-[13px] font-semibold transition-colors ${
        acenei
          ? "border-brand-500 bg-brand-500/10 text-brand-600"
          : "border-ink-800/15 text-ink-800 hover:bg-ink-800/[0.04]"
      }`}
    >
      👋 {acenei ? `boas-vindas enviadas${acenos > 1 ? ` · ${acenos}` : ""}` : `dar boas-vindas${acenos > 0 ? ` · ${acenos}` : ""}`}
    </button>
  );

  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-ink-800/10 bg-cream-50 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        {destino ? (
          <Link to={destino} className="block hover:opacity-90">
            <Cabecalho item={item} mostrarClube={mostrarClube} />
          </Link>
        ) : (
          <Cabecalho item={item} mostrarClube={mostrarClube} />
        )}
      </div>
      {lado}
    </div>
  );
}

/**
 * "terminou": uma linha só, com as reações que já têm contagem à direita ("👏 5"); sem
 * nenhuma, fica o 👏 para ser o primeiro a aplaudir. No clube (mock 2c) é só isso; na home
 * (mock 2b) leva o nome do clube e a capa do livro.
 */
/**
 * Progresso em uma linha: "Ana avançou para a pág. 64 de Torto Arado", com o clube e o horário
 * embaixo e as reações à direita (só as que já têm contagem; sem nenhuma, o 🔥).
 */
function LinhaDeProgresso({
  item,
  mostrarClube,
  onReagir,
}: {
  item: FeedItemResponse;
  mostrarClube: boolean;
  onReagir: (tipo: TipoReacao) => void;
}) {
  const destino = destinoDe(item);
  const quem = item.ehVoce ? "Você" : primeiroNome(item.usuarioNome);
  const posicao = `${item.unidade === "capítulos" ? "o cap." : "a pág."} ${item.valorAtual}`;
  const comContagem = REACOES.filter(({ tipo }) => (item.reacoes[tipo] ?? 0) > 0 || item.minhaReacao === tipo);
  const visiveis = comContagem.length > 0 ? comContagem : REACOES.filter(({ tipo }) => tipo === "FOGO");
  const texto = (
    <div className="flex min-w-0 items-center gap-2.5">
      <Avatar nome={item.usuarioNome ?? "?"} usuarioId={item.usuarioId ?? 0} fotoUrl={item.usuarioFotoUrl} size="sm" />
      <div className="min-w-0">
        <p className="text-[13px] leading-snug text-ink-800 lg:truncate">
          <strong className="font-semibold text-ink-900">{quem}</strong> avançou para {posicao} de{" "}
          <span className="font-semibold text-ink-900">{item.livroTitulo}</span>
        </p>
        <Detalhes item={item} mostrarClube={mostrarClube} />
      </div>
    </div>
  );
  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-ink-800/10 px-4 py-2.5">
      <div className="min-w-0 flex-1">
        {destino ? (
          <Link to={destino} className="block hover:opacity-90">
            {texto}
          </Link>
        ) : (
          texto
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2 text-xs text-muted-500">
        {visiveis.map(({ tipo, emoji, rotulo }) => {
          const total = item.reacoes[tipo] ?? 0;
          const marcada = item.minhaReacao === tipo;
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onReagir(tipo)}
              aria-label={rotulo}
              aria-pressed={marcada}
              className={`flex items-center gap-0.5 ${marcada ? "font-semibold text-brand-600" : ""}`}
            >
              <span className={marcada || total > 0 ? "" : "opacity-60 grayscale"}>{emoji}</span>
              {total > 0 && <span>{total}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function CartaoConclusao({
  item,
  mostrarClube,
  onReagir,
}: {
  item: FeedItemResponse;
  mostrarClube: boolean;
  onReagir: (tipo: TipoReacao) => void;
}) {
  const destino = destinoDe(item);
  const comContagem = REACOES.filter(({ tipo }) => (item.reacoes[tipo] ?? 0) > 0 || item.minhaReacao === tipo);
  // Na home o mock não mostra o 👏 vazio: só reações que alguém já deu.
  const visiveis =
    comContagem.length > 0 || mostrarClube ? comContagem : REACOES.filter(({ tipo }) => tipo === "PALMAS");
  const capa =
    mostrarClube && item.livroTitulo ? (
      <BookCover url={item.livroCapaUrl} titulo={item.livroTitulo} size="sm" />
    ) : null;
  return (
    <div className="flex items-center gap-3 rounded-xl2 border border-brand-500/40 bg-brand-50 px-5 py-3.5">
      <div className="min-w-0 flex-1">
        {destino ? (
          <Link to={destino} className="block hover:opacity-90">
            <Cabecalho item={item} mostrarClube={mostrarClube} />
          </Link>
        ) : (
          <Cabecalho item={item} mostrarClube={mostrarClube} />
        )}
        {/* Celular (mock 1b): "há 1 h · ❤️ 👏 5" logo abaixo, alinhado ao texto. */}
        {visiveis.length > 0 && (
          <div className="mt-0.5 flex items-center gap-2 pl-[52px] text-xs text-muted-500 lg:hidden">
            {visiveis.map(({ tipo, emoji, rotulo }) => {
              const total = item.reacoes[tipo] ?? 0;
              const marcada = item.minhaReacao === tipo;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => onReagir(tipo)}
                  aria-label={rotulo}
                  aria-pressed={marcada}
                  className={`flex items-center gap-0.5 ${marcada ? "font-semibold text-brand-600" : ""}`}
                >
                  <span>{emoji}</span>
                  {total > 0 && <span>{total}</span>}
                </button>
              );
            })}
          </div>
        )}
      </div>
      <div className="hidden shrink-0 gap-1.5 lg:flex">
        {visiveis.map(({ tipo, emoji, rotulo }) => {
          const total = item.reacoes[tipo] ?? 0;
          const marcada = item.minhaReacao === tipo;
          return (
            <button
              key={tipo}
              type="button"
              onClick={() => onReagir(tipo)}
              aria-label={rotulo}
              aria-pressed={marcada}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-[13px] transition-colors ${
                marcada
                  ? "border-brand-500 bg-brand-500/10 text-brand-600"
                  : "border-ink-800/15 text-muted-700 hover:bg-ink-800/[0.04]"
              }`}
            >
              <span>{emoji}</span>
              {total > 0 && <strong className="text-xs">{total}</strong>}
            </button>
          );
        })}
      </div>
      {capa}
    </div>
  );
}
