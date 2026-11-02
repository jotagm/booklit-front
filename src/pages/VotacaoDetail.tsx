import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarVotacaoPorId, encerrarVotacao, lembrarQuemNaoVotou } from "../api/votacoes";
import { criarOpcaoVoto, listarOpcoesPorVotacao } from "../api/opcoesVoto";
import { votar, listarVotosPorVotacao, buscarVotoPorVotacaoEUsuario } from "../api/votos";
import { buscarMembroPorUsuarioEClube, listarMembrosPorClube } from "../api/membros";
import type { OpcaoVotoResponse, UsuarioClubeResponse, VotacaoResponse, VotoResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import Button from "../components/Button";
import Modal from "../components/Modal";
import BookSearchPicker, { type LivroSelecionado } from "../components/BookSearchPicker";
import BookCover from "../components/BookCover";
import Avatar from "../components/Avatar";
import FacePile from "../components/FacePile";
import { plural } from "../utils/cores";
import { diasAte, formatarDiaMes, nomeDoDiaSemana, paraDate, rotuloPrazo } from "../utils/date";
import SugestoesDaEstante from "../components/estante/SugestoesDaEstante";

export default function VotacaoDetail() {
  const { votacaoId } = useParams<{ votacaoId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [votacao, setVotacao] = useState<VotacaoResponse | null>(null);
  const [souLider, setSouLider] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoVotoResponse[]>([]);
  const [votos, setVotos] = useState<VotoResponse[]>([]);
  const [membros, setMembros] = useState<UsuarioClubeResponse[]>([]);
  const [meuVoto, setMeuVoto] = useState<VotoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [votando, setVotando] = useState<string | null>(null);
  const [modalSugestao, setModalSugestao] = useState(false);
  const [livroSugerido, setLivroSugerido] = useState<LivroSelecionado | null>(null);
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [encerrando, setEncerrando] = useState(false);
  const [lembrando, setLembrando] = useState(false);
  const [avisoLembrete, setAvisoLembrete] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!votacaoId || !usuario) return;
    setErro(null);
    try {
      const votacaoResp = await buscarVotacaoPorId(votacaoId);
      const [meuMembro, opcoesResp, votosResp, meuVotoResp, membrosResp] = await Promise.all([
        buscarMembroPorUsuarioEClube(usuario.id, votacaoResp.clubeId),
        listarOpcoesPorVotacao(votacaoId),
        listarVotosPorVotacao(votacaoId),
        buscarVotoPorVotacaoEUsuario(votacaoId, usuario.id),
        listarMembrosPorClube(votacaoResp.clubeId).catch(() => [] as UsuarioClubeResponse[]),
      ]);

      setVotacao(votacaoResp);
      setSouLider(meuMembro?.papel === "LIDER");
      setOpcoes(opcoesResp);
      setVotos(votosResp);
      setMeuVoto(meuVotoResp);
      setMembros(membrosResp);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar a votação."));
    } finally {
      setCarregando(false);
    }
  }, [votacaoId, usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function pesoTotal(opcaoId: string): number {
    return votos.filter((v) => v.opcaoVotoId === opcaoId).reduce((soma, v) => soma + v.peso, 0);
  }

  async function votarNaOpcao(opcaoId: string) {
    if (!votacaoId || !usuario || meuVoto) return;
    setVotando(opcaoId);
    setErro(null);
    try {
      const voto = await votar({ votacaoId, opcaoVotoId: opcaoId, usuarioId: usuario.id });
      setMeuVoto(voto);
      setVotos((prev) => [...prev, voto]);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível registrar seu voto."));
    } finally {
      setVotando(null);
    }
  }

  async function sugerirLivro() {
    if (!votacaoId || !usuario || !livroSugerido) return;
    setEnviandoSugestao(true);
    setErro(null);
    try {
      const opcao = await criarOpcaoVoto({
        votacaoId,
        sugeridoPorId: usuario.id,
        livroGoogleId: livroSugerido.livroGoogleId,
        livroTitulo: livroSugerido.livroTitulo,
        livroCapaUrl: livroSugerido.livroCapaUrl,
        livroAutor: livroSugerido.livroAutor ?? null,
      });
      setOpcoes((prev) => [...prev, opcao]);
      setModalSugestao(false);
      setLivroSugerido(null);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível sugerir este livro."));
    } finally {
      setEnviandoSugestao(false);
    }
  }

  async function lembrar() {
    if (!votacaoId || !votacao) return;
    setLembrando(true);
    setErro(null);
    try {
      const r = await lembrarQuemNaoVotou(votacaoId);
      setVotacao({ ...votacao, ultimoLembreteEm: r.lembradoEm });
      setAvisoLembrete(`lembrete enviado para ${plural(r.notificados, "pessoa", "pessoas")}`);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível enviar o lembrete."));
    } finally {
      setLembrando(false);
    }
  }

  async function encerrar() {
    if (!votacaoId) return;
    setEncerrando(true);
    setErro(null);
    try {
      const novaLeitura = await encerrarVotacao(votacaoId);
      // O livro vencedor nasce sem meta e datas: o líder (quem encerra) já vai defini-las.
      navigate(`/clubes/${votacao?.clubeId ?? novaLeitura.clubeId}/leituras/nova?leitura=${novaLeitura.id}`, {
        replace: true,
      });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível encerrar a votação."));
      setEncerrando(false);
    }
  }

  if (carregando) return <Spinner label="carregando votação..." />;
  if (erro && !votacao) return <div className="p-4"><ErrorBanner mensagem={erro} /></div>;
  if (!votacao) return null;

  const maiorPeso = Math.max(1, ...opcoes.map((o) => pesoTotal(o.id)));
  const votacaoAberta = votacao.status === "ABERTA";
  const votaram = new Set(votos.map((v) => v.usuarioId));
  const pessoa = (id: number) => membros.find((m) => m.usuarioId === id);
  const faltam = membros.filter((m) => !votaram.has(m.usuarioId));
  const primeiro = (nome: string) => nome.trim().split(/\s+/)[0];
  const dataFecha = votacao.dataEncerramento;
  // Mesmo limite do backend: um lembrete a cada 24 horas.
  const ultimoLembrete = paraDate(votacao.ultimoLembreteEm);
  const lembradoRecente = ultimoLembrete !== null && Date.now() - ultimoLembrete.getTime() < 24 * 60 * 60 * 1000;
  // O líder não lembra a si mesmo: só faz sentido se falta alguém além dele.
  const faltamOutros = faltam.some((m) => m.usuarioId !== usuario?.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <Link to={`/clubes/${votacao.clubeId}`} className="text-sm text-muted-600 hover:text-ink-800">
        ← {votacao.nomeClube}
      </Link>

      <h1 className="mt-3 font-serif text-[26px] leading-tight text-ink-900 lg:text-[32px]">Qual o próximo livro?</h1>
      <p className="mt-1 text-sm font-semibold text-brand-600">
        {votacaoAberta
          ? diasAte(dataFecha) === 0
            ? `fecha hoje · ${nomeDoDiaSemana(dataFecha)}`
            : `fecha em ${rotuloPrazo(diasAte(dataFecha))} · ${nomeDoDiaSemana(dataFecha)}, ${formatarDiaMes(dataFecha)}`
          : "votação encerrada"}
      </p>

      {erro && (
        <div className="mt-3">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      {membros.length > 0 && (
        <div className="card mt-4 flex items-center gap-3 px-4 py-3">
          <FacePile
            pessoas={membros
              .filter((m) => votaram.has(m.usuarioId))
              .map((m) => ({ usuarioId: m.usuarioId, nome: m.nomeUsuario, fotoUrl: m.fotoUrl }))}
            tamanho={26}
            vagas={votacaoAberta ? Math.min(faltam.length, 3) : 0}
          />
          <div className="flex-1 text-[13px] leading-snug">
            <strong className="text-ink-900">
              {votaram.size} de {membros.length} votaram
            </strong>
            {votacaoAberta && faltam.length > 0 && (
              <p className="text-muted-500">
                faltam {faltam.slice(0, 2).map((m) => primeiro(m.nomeUsuario)).join(" e ")}
                {faltam.length > 2 ? ` e +${faltam.length - 2}` : ""}
              </p>
            )}
            {avisoLembrete && <p className="text-xs font-semibold text-brand-600">{avisoLembrete}</p>}
          </div>
          {souLider && votacaoAberta && faltamOutros && (
            <button
              type="button"
              onClick={lembrar}
              disabled={lembrando || lembradoRecente}
              title={lembradoRecente ? "dá para lembrar de novo 24 horas depois do último lembrete" : undefined}
              className="shrink-0 text-[13px] font-semibold text-brand-600 hover:text-brand-700 disabled:text-muted-500"
            >
              {lembrando ? "…" : lembradoRecente ? "lembrado" : "lembrar"}
            </button>
          )}
        </div>
      )}

      {opcoes.length === 0 ? (
        <div className="mt-4">
          <EmptyState titulo="Nenhuma opção ainda" descricao="Sugira o primeiro livro para começar a votação." />
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {opcoes.map((opcao) => {
            const peso = pesoTotal(opcao.id);
            const percentual = Math.round((peso / maiorPeso) * 100);
            const jaVotouAqui = meuVoto?.opcaoVotoId === opcao.id;
            const votosDaOpcao = votos.filter((v) => v.opcaoVotoId === opcao.id);

            return (
              <li
                key={opcao.id}
                className={`card flex flex-col gap-2.5 p-3.5 ${jaVotouAqui ? "!border-2 !border-brand-500" : ""}`}
              >
                <div className="flex gap-3">
                  <BookCover url={opcao.livroCapaUrl} titulo={opcao.livroTitulo} size="md" />
                  <div className="flex min-w-0 flex-1 flex-col gap-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-serif text-[17px] leading-tight text-ink-900">{opcao.livroTitulo}</p>
                        {opcao.livroAutor && <p className="mt-0.5 truncate text-xs text-muted-500">{opcao.livroAutor}</p>}
                      </div>
                      {jaVotouAqui && <span className="chip-forte shrink-0 !px-2 !py-0.5 !text-[11px]">seu voto</span>}
                    </div>
                    <p className="flex items-center gap-1.5 text-xs text-muted-600">
                      <Avatar
                        nome={opcao.nomeSugeridoPor}
                        usuarioId={opcao.sugeridoPorId}
                        fotoUrl={pessoa(opcao.sugeridoPorId)?.fotoUrl}
                        size="sm"
                        className="!h-4 !w-4 !text-[0px]"
                      />
                      {primeiro(opcao.nomeSugeridoPor)} sugeriu
                      {opcao.membrosQueremLer > 0 &&
                        ` · ${opcao.membrosQueremLer} ${opcao.membrosQueremLer === 1 ? "quer" : "querem"} ler`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-ink-800/10">
                    <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${percentual}%` }} />
                  </div>
                  <FacePile
                    pessoas={votosDaOpcao.map((v) => ({
                      usuarioId: v.usuarioId,
                      nome: v.nomeUsuario,
                      fotoUrl: pessoa(v.usuarioId)?.fotoUrl,
                    }))}
                    tamanho={20}
                    max={4}
                  />
                  <span className="shrink-0 text-xs font-semibold text-ink-900" title="o voto do líder vale 2 pontos">
                    {plural(peso, "ponto", "pontos")}
                  </span>
                </div>
                {votacaoAberta && !meuVoto && (
                  <Button
                    className="!py-2 text-sm"
                    loading={votando === opcao.id}
                    disabled={votando !== null}
                    onClick={() => votarNaOpcao(opcao.id)}
                  >
                    votar neste
                  </Button>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {votacaoAberta && (
        <button
          onClick={() => setModalSugestao(true)}
          className="mt-3 w-full rounded-xl2 border-[1.5px] border-dashed border-ink-800/25 p-3.5 text-sm font-semibold text-brand-600 hover:bg-ink-800/[0.03]"
        >
          + sugerir um livro
        </button>
      )}

      {votacaoAberta && souLider && (
        <div className="mt-6 border-t border-ink-800/10 pt-5">
          <Button fullWidth loading={encerrando} onClick={encerrar} disabled={opcoes.length === 0}>
            encerrar votação e definir próxima leitura
          </Button>
        </div>
      )}

      <Modal aberto={modalSugestao} onFechar={() => setModalSugestao(false)} titulo="Sugerir livro">
        <SugestoesDaEstante
          selecionado={livroSugerido}
          onSelecionar={setLivroSugerido}
          ignorar={opcoes.map((o) => o.livroGoogleId)}
        />
        <BookSearchPicker selecionado={livroSugerido} onSelecionar={setLivroSugerido} />
        <Button
          fullWidth
          className="mt-4"
          disabled={!livroSugerido}
          loading={enviandoSugestao}
          onClick={sugerirLivro}
        >
          sugerir esta opção
        </Button>
      </Modal>
    </div>
  );
}
