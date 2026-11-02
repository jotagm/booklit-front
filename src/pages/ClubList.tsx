import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePainel } from "../hooks/usePainel";
import type { Painel, Prazo } from "../hooks/usePainel";
import type { FeedItemResponse, UsuarioId } from "../api/types";
import { atualizarProgresso } from "../api/registros";
import ClubCard from "../components/ClubCard";
import ConvitesPendentes from "../components/ConvitesPendentes";
import BookCover from "../components/BookCover";
import ProgressBar from "../components/ProgressBar";
import Avatar from "../components/Avatar";
import FeedAtividade from "../components/FeedAtividade";
import FacePile from "../components/FacePile";
import Modal from "../components/Modal";
import StepperProgresso from "../components/StepperProgresso";
import { LendoAgoraFaixa, LendoAgoraLista, quemEstaLendo } from "../components/LendoAgora";
import Button from "../components/Button";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import { diasAte, nomeDoDiaSemana, rotuloPrazo } from "../utils/date";

function saudacao(agora = new Date()): string {
  const hora = agora.getHours();
  if (hora < 12) return "bom dia";
  if (hora < 18) return "boa tarde";
  return "boa noite";
}

/** "Ana, Bruno e Diego" */
function juntarNomes(nomes: string[]): string {
  return nomes.join(", ").replace(/, ([^,]*)$/, " e $1");
}

export default function ClubList() {
  const { usuario } = useAuth();
  const { painel, erro, recarregar } = usePainel();
  const [feed, setFeed] = useState<FeedItemResponse[]>([]);

  const primeiroNome = usuario ? usuario.nome.trim().split(/\s+/)[0] : "";
  const lendo = quemEstaLendo(feed);
  const leramHoje = lendo.filter((i) => diasAte(i.quando) === 0).length;
  const clubeComVotacao = painel?.clubes.find((c) => c.votacaoAberta);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <header className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-[28px] font-bold leading-tight text-ink-900 lg:text-4xl">
            {saudacao()}, {primeiroNome}
          </h1>
          {painel && (painel.semanasDeSequencia > 0 || leramHoje > 0) && (
            <p className="mt-1 text-sm text-muted-600">
              {painel.semanasDeSequencia > 0 && (
                <>
                  🔥 {painel.semanasDeSequencia} {painel.semanasDeSequencia === 1 ? "semana" : "semanas"}
                </>
              )}
              {painel.semanasDeSequencia > 0 && leramHoje > 0 && " · "}
              {leramHoje > 0 && (
                <>
                  {leramHoje} {leramHoje === 1 ? "amigo leu" : "amigos leram"} hoje
                </>
              )}
            </p>
          )}
        </div>

        <Link to="/clubes/novo" className="hidden lg:block">
          <Button>+ criar clube</Button>
        </Link>
        {usuario && (
          <Link to="/perfil" className="lg:hidden" aria-label="perfil">
            <Avatar nome={usuario.nome} usuarioId={usuario.id} fotoUrl={usuario.fotoUrl} size="md" />
          </Link>
        )}
      </header>

      <ConvitesPendentes />

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
        // No mobile vira uma coluna só e a ordem segue o mock (lendo agora, continuar
        // leitura, banner de voto, feed, clubes, prazos) — daí o `contents` nos dois
        // grupos e as classes de `order`.
        <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_280px] lg:items-start lg:gap-8">
          <div className="contents lg:flex lg:flex-col lg:gap-5">
            <div className="order-1 lg:hidden">
              <LendoAgoraFaixa itens={lendo} />
            </div>

            {painel.continuarLeitura && (
              <section className="order-2">
                <ContinuarLeitura
                  cl={painel.continuarLeitura}
                  meuId={usuario?.id ?? null}
                  aoSalvar={recarregar}
                />
              </section>
            )}

            {clubeComVotacao?.votacaoAberta && (
              <Link
                to={`/votacoes/${clubeComVotacao.votacaoAberta.id}`}
                className="order-3 flex items-center gap-2 rounded-[14px] bg-brand-50 px-3.5 py-2.5 text-[13px] text-brand-700 lg:hidden"
              >
                <span>🗳</span>
                <span className="min-w-0 flex-1 truncate">
                  <strong>vote até {nomeDoDiaSemana(clubeComVotacao.votacaoAberta.dataEncerramento)}</strong> ·{" "}
                  {clubeComVotacao.membro.nomeClube}
                </span>
                <span className="shrink-0 font-semibold">votar →</span>
              </Link>
            )}

            <div className="order-4">
              <FeedAtividade limite={20} titulo="nos seus clubes" onItens={setFeed} />
            </div>

            <section className="order-5">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="section-label mb-0">seus clubes</h2>
                <Link to="/clubes/novo" className="text-sm font-semibold text-brand-600 lg:hidden">
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

          <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-6">
            <div className="hidden lg:block">
              <LendoAgoraLista itens={lendo} />
            </div>

            {painel.prazos.length > 0 && (
              <section className="order-6">
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
          </div>
        </div>
      )}
    </div>
  );
}

function ContinuarLeitura({
  cl,
  meuId,
  aoSalvar,
}: {
  cl: NonNullable<Painel["continuarLeitura"]>;
  meuId: UsuarioId | null;
  aoSalvar: () => Promise<void>;
}) {
  const [registrando, setRegistrando] = useState(false);
  const outros = cl.registrosDoGrupo.filter((r) => r.usuarioId !== meuId);
  const nomes = outros.slice(0, 3).map((r) => r.nomeUsuario.trim().split(/\s+/)[0]);
  const atual = cl.registro?.valorAtual ?? 0;
  const leituraId = cl.leitura.id;

  // Estável: o stepper usa o callback como dependência do debounce.
  const salvar = useCallback(
    async (valor: number) => {
      await atualizarProgresso(leituraId, valor);
      await aoSalvar();
    },
    [leituraId, aoSalvar]
  );

  return (
    <div className="card flex flex-col gap-3 p-4 lg:p-5">
      <Link to={`/leituras/${cl.leitura.id}`} className="flex items-center gap-4">
        <BookCover url={cl.leitura.livroCapaUrl} titulo={cl.leitura.livroTitulo} size="md" />
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
            continuar leitura
            {/* no mobile o nome do clube é omitido para o rótulo caber numa linha */}
            <span className="hidden lg:inline"> · {cl.leitura.nomeClube}</span>
          </p>
          <p className="truncate font-serif text-xl text-ink-900">{cl.leitura.livroTitulo}</p>
          {outros.length > 0 && (
            <div className="mt-1.5 flex items-center gap-1.5">
              <FacePile
                pessoas={outros.map((r) => ({ usuarioId: r.usuarioId, nome: r.nomeUsuario, fotoUrl: r.fotoUrl }))}
                max={3}
                tamanho={20}
              />
              <span className="text-xs text-muted-600">
                {juntarNomes(nomes)}
                {outros.length > 3 ? ` e +${outros.length - 3}` : ""} {outros.length === 1 ? "lê" : "leem"} com
                você
              </span>
            </div>
          )}
        </div>
      </Link>
      <div className="flex items-center gap-2.5">
        <div className="min-w-0 flex-1">
          <ProgressBar atual={atual} meta={cl.leitura.valorMeta} />
        </div>
        <span className="shrink-0 text-[13px] text-muted-500">
          {atual} / {cl.leitura.valorMeta}
        </span>
        <button onClick={() => setRegistrando(true)} className="btn-primary shrink-0 !px-3 !py-1.5 text-[13px]">
          + registrar
        </button>
      </div>

      <Modal aberto={registrando} onFechar={() => setRegistrando(false)} titulo={cl.leitura.livroTitulo}>
        <StepperProgresso
          valor={atual}
          meta={cl.leitura.valorMeta}
          unidade={cl.leitura.tipoMeta === "PAGINA" ? "pág." : "cap."}
          onSalvar={salvar}
        />
      </Modal>
    </div>
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
