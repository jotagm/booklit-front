import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { usePainel } from "../hooks/usePainel";
import { useNovidades } from "../hooks/useNovidades";
import type { Painel, Prazo } from "../hooks/usePainel";
import type { FeedItemResponse, UsuarioId } from "../api/types";
import { atualizarProgresso } from "../api/registros";
import { extrairMensagemErro } from "../api/client";
import ClubCard from "../components/ClubCard";
import ConvitesPendentes from "../components/ConvitesPendentes";
import BookCover from "../components/BookCover";
import ProgressBar from "../components/ProgressBar";
import Avatar from "../components/Avatar";
import FeedAtividade from "../components/FeedAtividade";
import ComposerDaHome from "../components/ComposerDaHome";
import FacePile from "../components/FacePile";
import Modal from "../components/Modal";
import StepperProgresso from "../components/StepperProgresso";
import { LendoAgoraFaixa, LendoAgoraLista, lendoAgoraDoPainel, quemEstaLendo } from "../components/LendoAgora";
import Button from "../components/Button";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import { diasAte, formatarDiaMes, nomeDoDiaSemana } from "../utils/date";

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
  const temNovidade = useNovidades();
  // Muda a cada comentário publicado pela home, para o feed recarregar e mostrá-lo.
  const [versaoDoFeed, setVersaoDoFeed] = useState(0);

  const primeiroNome = usuario ? usuario.nome.trim().split(/\s+/)[0] : "";
  const lendo = painel ? lendoAgoraDoPainel(painel.clubes, feed, usuario?.id ?? null) : quemEstaLendo(feed);
  const temLeituraAtiva = !!painel?.clubes.some((c) => c.leituraAtiva);
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

            {/* Comentar sem sair da home: só no desktop, como no mock 2b. */}
            {usuario && (
              <div className="order-3 hidden lg:block">
                <ComposerDaHome
                  usuario={usuario}
                  leituras={painel.clubes.flatMap((c) => (c.leituraAtiva ? [c.leituraAtiva] : []))}
                  inicial={painel.continuarLeitura?.leitura}
                  onPublicado={() => setVersaoDoFeed((v) => v + 1)}
                />
              </div>
            )}

            <div className="order-4">
              <FeedAtividade
                key={versaoDoFeed}
                limite={30}
                progressoCompacto
                titulo="nos seus clubes"
                classeDoTitulo="lg:hidden"
                meuUsuarioId={usuario?.id ?? null}
                onItens={setFeed}
              />
            </div>

            {/* No desktop os clubes já estão na sidebar (mock 2b não repete a lista). */}
            <section className="order-5 lg:hidden">
              <div className="mb-2 flex items-center justify-between">
                <h2 className="section-label mb-0">seus clubes</h2>
                <Link to="/clubes/novo" className="text-sm font-semibold text-brand-600 lg:hidden">
                  + criar clube
                </Link>
              </div>
              <ul className="flex flex-col gap-4">
                {painel.clubes.map((clube) => (
                  <li key={clube.membro.id}>
                    <ClubCard clube={clube} novidade={temNovidade(clube.membro.clubeId)} />
                  </li>
                ))}
              </ul>
            </section>
          </div>

          <div className="contents lg:sticky lg:top-8 lg:flex lg:flex-col lg:gap-6">
            <div className="hidden lg:block">
              <LendoAgoraLista
                itens={lendo}
                vazio={temLeituraAtiva ? "ninguém dos seus clubes registrou progresso ainda" : undefined}
              />
            </div>

            {painel.prazos.length > 0 && (
              <section className="order-6">
                <h2 className="section-label">próximos prazos</h2>
                <ul className="flex flex-col gap-2">
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
  const [erro, setErro] = useState<string | null>(null);
  const outros = cl.registrosDoGrupo.filter((r) => r.usuarioId !== meuId);
  const nomes = outros.slice(0, 3).map((r) => r.nomeUsuario.trim().split(/\s+/)[0]);
  const atual = cl.registro?.valorAtual ?? 0;
  const leituraId = cl.leitura.id;

  // Estável: o stepper usa o callback como dependência do debounce.
  const salvar = useCallback(
    async (valor: number) => {
      setErro(null);
      try {
        await atualizarProgresso(leituraId, valor);
        await aoSalvar();
      } catch (e) {
        setErro(extrairMensagemErro(e, "Não foi possível salvar seu progresso."));
      }
    },
    [leituraId, aoSalvar]
  );

  const rostos =
    outros.length > 0 ? (
      <div className="flex items-center gap-1.5">
        <FacePile
          pessoas={outros.map((r) => ({ usuarioId: r.usuarioId, nome: r.nomeUsuario, fotoUrl: r.fotoUrl }))}
          max={3}
          tamanho={20}
        />
        <span className="text-xs text-muted-600">
          {juntarNomes(nomes)}
          {outros.length > 3 ? ` e +${outros.length - 3}` : ""} {outros.length === 1 ? "lê" : "leem"} com você
        </span>
      </div>
    ) : null;

  const modal = (
    <Modal aberto={registrando} onFechar={() => setRegistrando(false)} titulo={cl.leitura.livroTitulo}>
      <StepperProgresso
        valor={atual}
        meta={cl.leitura.valorMeta}
        unidade={cl.leitura.tipoMeta === "PAGINA" ? "pág." : "cap."}
        onSalvar={salvar}
      />
      {erro && <p className="mt-3 text-center text-xs text-red-600">{erro}</p>}
    </Modal>
  );

  const botao = (
    <button onClick={() => setRegistrando(true)} className="btn-primary shrink-0 !px-3 !py-1.5 text-[13px] lg:!px-4 lg:!py-2.5 lg:text-sm">
      + registrar
    </button>
  );

  return (
    <>
      {/* Desktop (mock 2b): capa | rótulo, título, barra com a contagem, rostos | botão. */}
      <div className="card hidden items-center gap-5 p-5 lg:flex">
        <Link to={`/leituras/${cl.leitura.id}`} className="flex min-w-0 flex-1 items-center gap-4">
          <BookCover url={cl.leitura.livroCapaUrl} titulo={cl.leitura.livroTitulo} size="md" />
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
              continuar leitura · {cl.leitura.nomeClube}
            </p>
            <p className="truncate font-serif text-xl text-ink-900">{cl.leitura.livroTitulo}</p>
            <div className="mt-1.5 flex items-center gap-2.5">
              <div className="min-w-0 flex-1">
                <ProgressBar atual={atual} meta={cl.leitura.valorMeta} />
              </div>
              <span className="shrink-0 text-[13px] text-muted-500">
                {atual} / {cl.leitura.valorMeta}
              </span>
            </div>
            {rostos && <div className="mt-2">{rostos}</div>}
          </div>
        </Link>
        {botao}
      </div>

      {/* Celular (mock 1a): rostos sob o título; barra e botão numa linha embaixo. */}
      <div className="card flex flex-col gap-3 p-4 lg:hidden">
        <Link to={`/leituras/${cl.leitura.id}`} className="flex items-center gap-4">
          <BookCover url={cl.leitura.livroCapaUrl} titulo={cl.leitura.livroTitulo} size="md" />
          <div className="min-w-0 flex-1">
            {/* no celular o nome do clube é omitido para o rótulo caber numa linha */}
            <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">continuar leitura</p>
            <p className="truncate font-serif text-xl text-ink-900">{cl.leitura.livroTitulo}</p>
            {rostos && <div className="mt-1.5">{rostos}</div>}
          </div>
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="min-w-0 flex-1">
            <ProgressBar atual={atual} meta={cl.leitura.valorMeta} />
          </div>
          <span className="shrink-0 text-[13px] text-muted-500">
            {atual} / {cl.leitura.valorMeta}
          </span>
          {botao}
        </div>
      </div>
      {modal}
    </>
  );
}

/** "em 3 dias" · "amanhã" · "hoje" */
function emQuanto(dias: number | null): string {
  if (dias === null) return "";
  if (dias <= 0) return "hoje";
  if (dias === 1) return "amanhã";
  return `em ${dias} dias`;
}

/**
 * Mock 2b: a votação vira um cartão em destaque com quem já votou; o fim da leitura, uma linha
 * simples com a data. O clube fica na dica (title), como no mock, que não o mostra na linha.
 */
function LinhaPrazo({ prazo }: { prazo: Prazo }) {
  if (prazo.tipo === "votacao") {
    const votaram = prazo.votaram ?? [];
    return (
      <Link
        to={prazo.para}
        title={prazo.subtitulo}
        className="flex flex-col gap-1.5 rounded-[14px] bg-brand-50 px-3.5 py-3 hover:opacity-90"
      >
        <span className="flex items-baseline justify-between gap-2 text-brand-700">
          <span className="text-[13px] font-semibold">🗳 vote até {nomeDoDiaSemana(prazo.data)}</span>
          <span className="shrink-0 text-xs">{emQuanto(prazo.dias)}</span>
        </span>
        <span className="flex items-center gap-2 text-xs text-brand-700">
          {votaram.length > 0 && <FacePile pessoas={votaram} tamanho={18} anel="#FBEEE2" max={4} />}
          <span className="min-w-0 truncate">
            {votaram.length} de {prazo.totalMembros ?? 0} já votaram
          </span>
        </span>
      </Link>
    );
  }
  return (
    <Link
      to={prazo.para}
      title={prazo.subtitulo}
      className="flex items-baseline justify-between gap-3 rounded-[14px] border border-ink-800/10 bg-cream-50 px-3.5 py-3 hover:bg-ink-800/[0.03]"
    >
      <span className="min-w-0 truncate text-[13px] text-ink-900">
        fim de {prazo.titulo}
      </span>
      <span className="shrink-0 text-xs text-muted-600">{formatarDiaMes(prazo.data)}</span>
    </Link>
  );
}
