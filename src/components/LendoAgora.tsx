import { Link } from "react-router-dom";
import type { FeedItemResponse } from "../api/types";
import { corPorId } from "../utils/cores";
import { diasAte, tempoRelativo } from "../utils/date";

/** Último PROGRESSO/CONCLUIU de cada pessoa (exceto você), mais recente primeiro. */
export function quemEstaLendo(feed: FeedItemResponse[]): FeedItemResponse[] {
  const vistos = new Set<number>();
  return feed.filter((i) => {
    if (!i.usuarioId || i.ehVoce) return false;
    if (i.tipo !== "PROGRESSO" && i.tipo !== "CONCLUIU") return false;
    if (vistos.has(i.usuarioId)) return false;
    vistos.add(i.usuarioId);
    return true;
  });
}

const leuHoje = (i: FeedItemResponse) => (diasAte(i.quando) ?? -99) === 0;

function legenda(i: FeedItemResponse): string {
  if (i.tipo === "CONCLUIU") return "terminou 🎉";
  return leuHoje(i) ? `pág. ${i.valorAtual}` : tempoRelativo(i.quando);
}

/** Mobile: faixa horizontal de "stories". Anel brand-500 = atualizou hoje. */
export function LendoAgoraFaixa({ itens }: { itens: FeedItemResponse[] }) {
  if (itens.length === 0) return null;
  return (
    <ul className="sem-scrollbar -mx-4 flex gap-3.5 overflow-x-auto px-4 lg:hidden">
      {itens.map((i) => (
        <li key={i.usuarioId} className="w-14 shrink-0">
          <Link to={`/leitores/${i.usuarioId}`} className="flex flex-col items-center gap-1">
            <span className={`rounded-full border-2 p-0.5 ${leuHoje(i) ? "border-brand-500" : "border-ink-800/15"}`}>
              <Anel item={i} tamanho={44} />
            </span>
            <span className="max-w-full truncate text-[11px] font-semibold text-ink-900">{(i.usuarioNome ?? "").split(" ")[0]}</span>
            <span className="-mt-1 max-w-full truncate text-[10px] text-muted-500">{legenda(i)}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/** Desktop: lista na coluna lateral. */
export function LendoAgoraLista({ itens }: { itens: FeedItemResponse[] }) {
  if (itens.length === 0) return null;
  return (
    <section>
      <h2 className="section-label">lendo agora</h2>
      <ul className="card py-1.5">
        {itens.slice(0, 6).map((i) => (
          <li key={i.usuarioId}>
            <Link to={`/leitores/${i.usuarioId}`} className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-ink-800/[0.03]">
              <span className={`rounded-full border-2 p-0.5 ${leuHoje(i) ? "border-brand-500" : "border-ink-800/15"}`}>
                <Anel item={i} tamanho={24} />
              </span>
              <span className="min-w-0 flex-1 leading-tight">
                <span className="block text-[13px] font-semibold text-ink-900">{(i.usuarioNome ?? "").split(" ")[0]}</span>
                <span className="block truncate text-xs text-muted-500">
                  {i.livroTitulo} · {i.tipo === "CONCLUIU" ? "terminou" : `pág. ${i.valorAtual}`}
                </span>
              </span>
              <span className={`text-[11px] ${leuHoje(i) ? "font-semibold text-brand-600" : "text-muted-500"}`}>
                {leuHoje(i) ? "hoje" : tempoRelativo(i.quando)}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Anel({ item, tamanho }: { item: FeedItemResponse; tamanho: number }) {
  const ini = (item.usuarioNome ?? "?").trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
  return (
    <span
      className="flex items-center justify-center overflow-hidden rounded-full text-sm font-semibold text-cream-50"
      style={{ width: tamanho, height: tamanho, background: corPorId(item.usuarioId!) }}
    >
      {item.usuarioFotoUrl ? <img src={item.usuarioFotoUrl} alt="" className="h-full w-full object-cover" /> : tamanho > 30 ? ini : null}
    </span>
  );
}
