import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePainel } from "../hooks/usePainel";
import type { Evento, Prazo, TipoEvento } from "../hooks/usePainel";
import ClubCard from "../components/ClubCard";
import BookCover from "../components/BookCover";
import ProgressBar from "../components/ProgressBar";
import MiniCalendar from "../components/MiniCalendar";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import { rotuloPrazo, tempoRelativo } from "../utils/date";

const EMOJI_POR_EVENTO: Record<TipoEvento, string> = {
  terminou: "🎉",
  progresso: "📖",
  comentou: "💬",
  votacao: "🗳",
  sugestao: "📚",
  entrou: "👋",
};

// As três cores de cartão que o mock alterna no carrossel de novidades.
const CORES_NOVIDADE = ["bg-brand-500", "bg-muted-700", "bg-pedra-500"];

// Duas sugestões do mesmo membro na mesma votação viram uma linha só no feed.
function semRepetidos(eventos: Evento[]): Evento[] {
  const vistos = new Set<string>();
  return eventos.filter((e) => {
    if (vistos.has(e.titulo)) return false;
    vistos.add(e.titulo);
    return true;
  });
}

function destaques(eventos: Evento[], limite = 6): Evento[] {
  const vistos = new Set<string>();
  const escolhidos: Evento[] = [];
  for (const e of eventos) {
    const chave = `${e.nomeClube}|${e.tipo}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    escolhidos.push(e);
    if (escolhidos.length === limite) break;
  }
  return escolhidos;
}

function saudacao(agora = new Date()): string {
  const hora = agora.getHours();
  if (hora < 12) return "bom dia";
  if (hora < 18) return "boa tarde";
  return "boa noite";
}

export default function ClubList() {
  const { usuario } = useAuth();
  const { painel, erro } = usePainel();

  const primeiroNome = usuario ? usuario.nome.trim().split(/\s+/)[0] : "";
  // O carrossel do topo mostra destaques variados (um por clube + tipo de evento);
  // a lista lateral mostra a ordem cronológica pura.
  const novidades = destaques(semRepetidos(painel?.eventos ?? []));
  const atividade = semRepetidos(painel?.eventos ?? []).slice(0, 6);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <header className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-bold leading-tight text-ink-900 lg:text-4xl">
            {saudacao()}, {primeiroNome}
          </h1>
          {painel && painel.semanasDeSequencia > 0 && (
            <p className="mt-1 text-sm text-muted-600">
              🔥 {painel.semanasDeSequencia}{" "}
              {painel.semanasDeSequencia === 1 ? "semana" : "semanas"} de sequência de leitura
            </p>
          )}
        </div>

        <Link to="/clubes/novo" className="hidden lg:block">
          <Button>+ criar clube</Button>
        </Link>
        {usuario && (
          <Link to="/perfil" className="lg:hidden" aria-label="perfil">
            <Avatar nome={usuario.nome} size="md" />
          </Link>
        )}
      </header>

      {erro && <ErrorBanner mensagem={erro} />}
      {!erro && painel === null && <Spinner label="carregando seus clubes..." />}

      {painel !== null && painel.clubes.length === 0 && (
        <EmptyState
          titulo="Você ainda não tem clubes"
          descricao="Crie um clube novo ou aceite um convite para começar a ler em grupo."
          acao={
            <Link to="/clubes/novo">
              <Button>criar meu primeiro clube</Button>
            </Link>
          }
        />
      )}

      {painel !== null && painel.clubes.length > 0 && (
        // No mobile o grid vira uma coluna só e a ordem segue o mock (novidades,
        // continuar leitura, calendário, prazos, clubes, atividade) — daí o
        // `contents` nos dois grupos e as classes de `order`.
        <div className="flex flex-col gap-7 lg:grid lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
          <div className="contents lg:flex lg:flex-col lg:gap-7">
            {novidades.length > 0 && (
              <section className="order-1">
                <h2 className="section-label">novidades dos seus clubes</h2>
                <ul className="sem-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
                  {novidades.map((evento, i) => (
                    <li key={evento.id} className="w-64 shrink-0 snap-start">
                      <CartaoNovidade evento={evento} cor={CORES_NOVIDADE[i % CORES_NOVIDADE.length]} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {painel.continuarLeitura && (
              <section className="order-2">
                <Link
                  to={`/leituras/${painel.continuarLeitura.leitura.id}`}
                  className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md"
                >
                  <BookCover
                    url={painel.continuarLeitura.leitura.livroCapaUrl}
                    titulo={painel.continuarLeitura.leitura.livroTitulo}
                    size="lg"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
                      continuar leitura
                      {/* no mobile o nome do clube é omitido para o rótulo caber numa linha */}
                      <span className="hidden lg:inline"> · {painel.continuarLeitura.leitura.nomeClube}</span>
                    </p>
                    <p className="truncate font-serif text-xl text-ink-900">
                      {painel.continuarLeitura.leitura.livroTitulo}
                    </p>
                    <div className="mt-2 flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <ProgressBar
                          atual={painel.continuarLeitura.registro?.valorAtual ?? 0}
                          meta={painel.continuarLeitura.leitura.valorMeta}
                        />
                      </div>
                      <span className="shrink-0 text-sm text-muted-500">
                        {painel.continuarLeitura.registro?.valorAtual ?? 0} /{" "}
                        {painel.continuarLeitura.leitura.valorMeta}
                      </span>
                    </div>
                  </div>
                  <span className="hidden shrink-0 text-sm font-semibold text-brand-600 lg:block">
                    continuar →
                  </span>
                </Link>
              </section>
            )}

            <section className="order-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="section-label mb-0">seus clubes</h2>
                <Link
                  to="/clubes/novo"
                  className="text-sm font-semibold text-brand-600 lg:hidden"
                >
                  + criar clube
                </Link>
              </div>
              <ul className="flex flex-col gap-4">
                {painel.clubes.map((clube) => (
                  <li key={clube.membro.id}>
                    <ClubCard clube={clube} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="contents lg:flex lg:flex-col lg:gap-7">
            <div className="order-3">
              <MiniCalendar marcos={painel.prazos} />
            </div>

            {painel.prazos.length > 0 && (
              <section className="order-4">
                <h2 className="section-label">próximos prazos</h2>
                <ul className="card divide-y divide-ink-800/10">
                  {painel.prazos.map((prazo) => (
                    <li key={prazo.id}>
                      <LinhaPrazo prazo={prazo} />
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {atividade.length > 0 && (
              <section className="order-6">
                <h2 className="section-label">atividade recente</h2>
                <ul className="card divide-y divide-ink-800/10">
                  {atividade.map((evento) => (
                    <li key={`atividade-${evento.id}`}>
                      <Link to={evento.para} className="flex gap-3 px-4 py-3.5 hover:bg-ink-800/[0.03]">
                        {evento.autor ? (
                          <Avatar nome={evento.autor} size="sm" />
                        ) : (
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs">
                            {EMOJI_POR_EVENTO[evento.tipo]}
                          </span>
                        )}
                        <div className="min-w-0">
                          <p className="text-sm leading-snug text-ink-800">{evento.titulo}</p>
                          <p className="mt-0.5 text-xs text-muted-500">{tempoRelativo(evento.data)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function CartaoNovidade({ evento, cor }: { evento: Evento; cor: string }) {
  return (
    <Link
      to={evento.para}
      className={`flex h-full flex-col justify-between rounded-xl2 p-4 text-cream-50 transition-opacity hover:opacity-90 ${cor}`}
    >
      <span className="text-xl leading-none">{EMOJI_POR_EVENTO[evento.tipo]}</span>
      <span className="mt-3 text-sm font-semibold leading-snug">{evento.titulo}</span>
      <span className="mt-2 text-xs text-cream-50/75">{evento.nomeClube} · ver mais →</span>
    </Link>
  );
}

function LinhaPrazo({ prazo }: { prazo: Prazo }) {
  const urgente = (prazo.dias ?? 99) <= 3;

  return (
    <Link to={prazo.para} className="flex items-center justify-between gap-3 px-4 py-3.5 hover:bg-ink-800/[0.03]">
      <div className="min-w-0">
        <p className="truncate text-sm text-ink-900">{prazo.titulo}</p>
        <p className="truncate text-xs text-muted-500">{prazo.subtitulo}</p>
      </div>
      <span
        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
          urgente ? "bg-brand-50 text-brand-700" : "bg-ink-800/[0.06] text-muted-700"
        }`}
      >
        {rotuloPrazo(prazo.dias)}
      </span>
    </Link>
  );
}
