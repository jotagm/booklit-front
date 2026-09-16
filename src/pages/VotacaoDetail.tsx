import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarVotacaoPorId, encerrarVotacao } from "../api/votacoes";
import { criarOpcaoVoto, listarOpcoesPorVotacao } from "../api/opcoesVoto";
import { votar, listarVotosPorVotacao, buscarVotoPorVotacaoEUsuario } from "../api/votos";
import { buscarMembroPorUsuarioEClube } from "../api/membros";
import type { OpcaoVotoResponse, VotacaoResponse, VotoResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import Button from "../components/Button";
import Modal from "../components/Modal";
import BookSearchPicker, { type LivroSelecionado } from "../components/BookSearchPicker";
import { formatarData } from "../utils/date";

export default function VotacaoDetail() {
  const { votacaoId } = useParams<{ votacaoId: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [votacao, setVotacao] = useState<VotacaoResponse | null>(null);
  const [souLider, setSouLider] = useState(false);
  const [opcoes, setOpcoes] = useState<OpcaoVotoResponse[]>([]);
  const [votos, setVotos] = useState<VotoResponse[]>([]);
  const [meuVoto, setMeuVoto] = useState<VotoResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [votando, setVotando] = useState<string | null>(null);
  const [modalSugestao, setModalSugestao] = useState(false);
  const [livroSugerido, setLivroSugerido] = useState<LivroSelecionado | null>(null);
  const [enviandoSugestao, setEnviandoSugestao] = useState(false);
  const [encerrando, setEncerrando] = useState(false);

  const carregar = useCallback(async () => {
    if (!votacaoId || !usuario) return;
    setErro(null);
    try {
      const votacaoResp = await buscarVotacaoPorId(votacaoId);
      const [meuMembro, opcoesResp, votosResp, meuVotoResp] = await Promise.all([
        buscarMembroPorUsuarioEClube(usuario.id, votacaoResp.clubeId),
        listarOpcoesPorVotacao(votacaoId),
        listarVotosPorVotacao(votacaoId),
        buscarVotoPorVotacaoEUsuario(votacaoId, usuario.id),
      ]);

      setVotacao(votacaoResp);
      setSouLider(meuMembro?.papel === "LIDER");
      setOpcoes(opcoesResp);
      setVotos(votosResp);
      setMeuVoto(meuVotoResp);
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

  async function encerrar() {
    if (!votacaoId) return;
    setEncerrando(true);
    setErro(null);
    try {
      const novaLeitura = await encerrarVotacao(votacaoId);
      navigate(`/leituras/${novaLeitura.id}`, { replace: true });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível encerrar a votação."));
      setEncerrando(false);
    }
  }

  if (carregando) return <Spinner label="carregando votação..." />;
  if (erro && !votacao) return <div className="p-4"><ErrorBanner mensagem={erro} /></div>;
  if (!votacao) return null;

  const totalDeVotos = votos.length;
  const maiorPeso = Math.max(1, ...opcoes.map((o) => pesoTotal(o.id)));
  const votacaoAberta = votacao.status === "ABERTA";

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <Link to={`/clubes/${votacao.clubeId}`} className="text-sm text-muted-600 hover:text-ink-800">
        ← {votacao.nomeClube}
      </Link>

      <div className="mt-3 flex items-center justify-between">
        <h1 className="font-serif text-2xl text-ink-900">votação do próximo livro</h1>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase ${
            votacaoAberta ? "bg-brand-500 text-cream-50" : "bg-ink-800/10 text-muted-600"
          }`}
        >
          {votacaoAberta ? "aberta" : "encerrada"}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted-600">
        encerra em {formatarData(votacao.dataEncerramento)} · voto do líder vale 2 · {totalDeVotos} voto(s)
      </p>

      {erro && (
        <div className="mt-3">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      <div className="mt-5 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink-900">opções</h2>
        {votacaoAberta && (
          <button
            onClick={() => setModalSugestao(true)}
            className="text-sm font-semibold text-brand-600"
          >
            + sugerir livro
          </button>
        )}
      </div>

      {opcoes.length === 0 ? (
        <EmptyState titulo="Nenhuma opção ainda" descricao="Sugira o primeiro livro para começar a votação." />
      ) : (
        <ul className="mt-3 flex flex-col gap-3">
          {opcoes.map((opcao) => {
            const peso = pesoTotal(opcao.id);
            const percentual = Math.round((peso / maiorPeso) * 100);
            const jaVotouAqui = meuVoto?.opcaoVotoId === opcao.id;

            return (
              <li key={opcao.id} className="card p-4">
                <div className="flex gap-3">
                  {opcao.livroCapaUrl ? (
                    <img
                      src={opcao.livroCapaUrl}
                      alt={opcao.livroTitulo}
                      className="h-16 w-11 shrink-0 rounded object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-11 shrink-0 items-center justify-center rounded bg-ink-800/10 text-[9px] text-muted-600">
                      capa
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink-900">{opcao.livroTitulo}</p>
                    <p className="text-xs text-muted-500">sugerido por {opcao.nomeSugeridoPor}</p>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-ink-800/10">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all"
                        style={{ width: `${percentual}%` }}
                      />
                    </div>
                    <p className="mt-1 text-xs text-muted-500">{peso} ponto(s)</p>
                  </div>
                  {votacaoAberta && (
                    <Button
                      variant={jaVotouAqui ? "secondary" : "primary"}
                      className="!px-3 !py-2 text-xs shrink-0 self-center"
                      disabled={!!meuVoto || votando === opcao.id}
                      loading={votando === opcao.id}
                      onClick={() => votarNaOpcao(opcao.id)}
                    >
                      {jaVotouAqui ? "seu voto" : "votar"}
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {votacaoAberta && souLider && (
        <div className="mt-6 border-t border-ink-800/10 pt-5">
          <Button fullWidth loading={encerrando} onClick={encerrar} disabled={opcoes.length === 0}>
            encerrar votação e definir próxima leitura
          </Button>
        </div>
      )}

      <Modal aberto={modalSugestao} onFechar={() => setModalSugestao(false)} titulo="Sugerir livro">
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
