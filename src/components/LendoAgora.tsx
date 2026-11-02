import { Link } from "react-router-dom";
import type { FeedItemResponse, UsuarioId } from "../api/types";
import type { ClubeDoPainel } from "../hooks/usePainel";
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

/**
 * Quem está lendo, a partir do progresso de cada membro nas leituras ativas dos seus clubes
 * (os registros que o painel já carrega). O feed só completa com quem não aparece ali: ele vem
 * limitado aos itens mais recentes, e comentários empurram o progresso para fora dele.
 */
export function lendoAgoraDoPainel(
  clubes: ClubeDoPainel[],
  feed: FeedItemResponse[],
  meuId: UsuarioId | null
): FeedItemResponse[] {
  const porPessoa = new Map<UsuarioId, FeedItemResponse>();
  for (const c of clubes) {
    const l = c.leituraAtiva;
    if (!l) continue;
    for (const r of c.registros) {
      if (r.usuarioId === meuId || r.valorAtual <= 0) continue;
      const item: FeedItemResponse = {
        id: `registro:${r.id}`,
        tipo: l.valorMeta > 0 && r.valorAtual >= l.valorMeta ? "CONCLUIU" : "PROGRESSO",
        clubeId: c.membro.clubeId,
        clubeNome: c.membro.nomeClube,
        usuarioId: r.usuarioId,
        usuarioNome: r.nomeUsuario,
        usuarioFotoUrl: r.fotoUrl ?? null,
        ehVoce: false,
        quando: r.updatedAt,
        livroTitulo: l.livroTitulo,
        livroCapaUrl: l.livroCapaUrl,
        valorAtual: r.valorAtual,
        valorMeta: l.valorMeta,
        leituraId: l.id,
        reacoes: {},
      };
      const atual = porPessoa.get(r.usuarioId);
      if (!atual || new Date(item.quando) > new Date(atual.quando)) porPessoa.set(r.usuarioId, item);
    }
  }
  for (const i of quemEstaLendo(feed)) {
    if (i.usuarioId && i.usuarioId !== meuId && !porPessoa.has(i.usuarioId)) porPessoa.set(i.usuarioId, i);
  }
  return [...porPessoa.values()].sort((a, b) => new Date(b.quando).getTime() - new Date(a.quando).getTime());
}

const leuHoje = (i: FeedItemResponse) => (diasAte(i.quando) ?? -99) === 0;

/** "2 d" — a coluna lateral do desktop (mock 2b) usa a forma curta. */
const diasCurto = (i: FeedItemResponse) => `${Math.max(1, -(diasAte(i.quando) ?? -1))} d`;

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

/**
 * Desktop: lista na coluna lateral. Com `vazio`, a seção aparece mesmo sem ninguém, para a
 * coluna não sumir quando os outros membros ainda não registraram progresso.
 */
export function LendoAgoraLista({ itens, vazio }: { itens: FeedItemResponse[]; vazio?: string }) {
  if (itens.length === 0 && !vazio) return null;
  return (
    <section>
      <h2 className="section-label">lendo agora</h2>
      {itens.length === 0 ? (
        <p className="card px-4 py-3.5 text-[13px] text-muted-500">{vazio}</p>
      ) : (
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
                  {leuHoje(i) ? "hoje" : diasCurto(i)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
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
