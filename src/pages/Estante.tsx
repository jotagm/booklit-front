import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { buscarResumoDaEstante, definirMetaAnual, listarEstante } from "../api/estante";
import type { EstanteResumoResponse, LeituraPessoalResponse, StatusLeituraPessoal } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import BookCover from "../components/BookCover";
import Button from "../components/Button";
import Modal from "../components/Modal";
import ProgressBar from "../components/ProgressBar";
import { EmptyState, ErrorBanner, Spinner } from "../components/Feedback";
import AdicionarNaEstante from "../components/estante/AdicionarNaEstante";
import DetalheDaEstante from "../components/estante/DetalheDaEstante";
import { Estrelas, ROTULO_ABA, STATUS_ORDEM } from "../components/estante/estanteUi";

const DESCRICAO_VAZIA: Record<StatusLeituraPessoal, string> = {
  LENDO: "Nenhum livro em andamento. Comece um da lista de quero ler ou adicione um novo.",
  QUERO_LER: "Guarde aqui os livros que você quer ler — eles aparecem na votação do clube.",
  LIDO: "Os livros que você terminar (sozinho ou com o clube) aparecem aqui.",
  ABANDONADO: "Nada abandonado. Tudo bem largar um livro que não está funcionando.",
};

// Estante pessoal: o que a pessoa lê fora (ou além) do clube. É o motivo para abrir o
// Booklit todo dia, e alimenta o clube: o "quero ler" aparece na votação, e o progresso
// registrado no clube entra aqui sozinho.
export default function Estante() {
  const anoAtual = new Date().getFullYear();

  const [itens, setItens] = useState<LeituraPessoalResponse[]>([]);
  const [resumo, setResumo] = useState<EstanteResumoResponse | null>(null);
  const [aba, setAba] = useState<StatusLeituraPessoal | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [adicionando, setAdicionando] = useState(false);
  const [selecionado, setSelecionado] = useState<LeituraPessoalResponse | null>(null);
  const [editandoMeta, setEditandoMeta] = useState(false);

  const carregar = useCallback(async () => {
    setErro(null);
    try {
      const [lista, res] = await Promise.all([listarEstante(), buscarResumoDaEstante(anoAtual)]);
      setItens(lista);
      setResumo(res);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar sua estante."));
    } finally {
      setCarregando(false);
    }
  }, [anoAtual]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const porStatus = useMemo(() => {
    const mapa: Record<StatusLeituraPessoal, LeituraPessoalResponse[]> = {
      LENDO: [],
      QUERO_LER: [],
      LIDO: [],
      ABANDONADO: [],
    };
    itens.forEach((i) => mapa[i.status].push(i));
    return mapa;
  }, [itens]);

  // Abre na aba mais útil: o que está lendo; se nada, o que quer ler.
  const abaAtiva: StatusLeituraPessoal =
    aba ?? (porStatus.LENDO.length > 0 ? "LENDO" : porStatus.QUERO_LER.length > 0 ? "QUERO_LER" : "LENDO");

  async function atualizarResumo() {
    try {
      setResumo(await buscarResumoDaEstante(anoAtual));
    } catch {
      // O resumo é acessório; a lista já foi atualizada.
    }
  }

  function aoAtualizar(l: LeituraPessoalResponse) {
    setItens((prev) => prev.map((i) => (i.id === l.id ? l : i)));
    setSelecionado(l);
    atualizarResumo();
  }

  function aoRemover(id: string) {
    setItens((prev) => prev.filter((i) => i.id !== id));
    setSelecionado(null);
    atualizarResumo();
  }

  function aoAdicionar(l: LeituraPessoalResponse) {
    setItens((prev) => [l, ...prev]);
    setAdicionando(false);
    setAba(l.status);
    atualizarResumo();
  }

  if (carregando) return <Spinner label="carregando estante..." />;

  const lista = porStatus[abaAtiva];

  return (
    <div className="mx-auto w-full max-w-5xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <div className="mb-6 flex items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-[28px] font-bold text-ink-900 lg:text-4xl">estante</h1>
          <p className="text-sm text-muted-600">seus livros, dentro e fora do clube</p>
        </div>
        <Button onClick={() => setAdicionando(true)} className="px-4 py-2.5">
          + livro
        </Button>
      </div>

      {erro && (
        <div className="mb-4">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      {resumo && <CartaoDaMeta resumo={resumo} onEditar={() => setEditandoMeta(true)} />}

      <div className="mt-6 flex gap-2 overflow-x-auto pb-1">
        {STATUS_ORDEM.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setAba(s)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
              abaAtiva === s ? "bg-ink-900 text-cream-50" : "bg-ink-800/[0.06] text-muted-700 hover:bg-ink-800/10"
            }`}
          >
            {ROTULO_ABA[s]} <span className="opacity-60">{porStatus[s].length}</span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        {lista.length === 0 ? (
          <EmptyState
            titulo={itens.length === 0 ? "Sua estante está vazia" : `Nada em "${ROTULO_ABA[abaAtiva]}"`}
            descricao={DESCRICAO_VAZIA[abaAtiva]}
            acao={
              <Button variant="secondary" onClick={() => setAdicionando(true)}>
                adicionar livro
              </Button>
            }
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {lista.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  onClick={() => setSelecionado(l)}
                  className="card flex h-full w-full gap-3 p-3 text-left transition-shadow hover:shadow-md"
                >
                  <BookCover url={l.livroCapaUrl} titulo={l.livroTitulo} />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 block font-serif text-base leading-tight text-ink-900">
                      {l.livroTitulo}
                    </span>
                    {l.livroAutor && <span className="mt-0.5 block truncate text-xs text-muted-600">{l.livroAutor}</span>}
                    {l.status === "LENDO" && (
                      <span className="mt-2 block">
                        {l.totalPaginas ? (
                          <>
                            <ProgressBar atual={l.paginaAtual} meta={l.totalPaginas} />
                            <span className="mt-1 block text-[11px] text-muted-500">
                              pág. {l.paginaAtual} de {l.totalPaginas}
                            </span>
                          </>
                        ) : (
                          <span className="block text-[11px] text-muted-500">pág. {l.paginaAtual}</span>
                        )}
                      </span>
                    )}
                    {l.status === "LIDO" && l.nota != null && (
                      <span className="mt-1.5 block">
                        <Estrelas nota={l.nota} tamanho="sm" />
                      </span>
                    )}
                    {l.clubeOrigemId && <span className="chip-suave mt-2 px-2 py-0.5 text-[10px]">clube</span>}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Modal aberto={adicionando} onFechar={() => setAdicionando(false)} titulo="Adicionar à estante">
        <AdicionarNaEstante onAdicionado={aoAdicionar} />
      </Modal>

      {selecionado && (
        <Modal aberto onFechar={() => setSelecionado(null)} titulo={selecionado.livroTitulo}>
          <DetalheDaEstante
            key={selecionado.id}
            leitura={selecionado}
            onAtualizado={aoAtualizar}
            onRemovido={aoRemover}
          />
        </Modal>
      )}

      {resumo && (
        <Modal aberto={editandoMeta} onFechar={() => setEditandoMeta(false)} titulo={`Meta de ${resumo.ano}`}>
          <FormMeta
            ano={resumo.ano}
            atual={resumo.metaLivros}
            onSalvo={(r) => {
              setResumo(r);
              setEditandoMeta(false);
            }}
          />
        </Modal>
      )}
    </div>
  );
}

function CartaoDaMeta({ resumo, onEditar }: { resumo: EstanteResumoResponse; onEditar: () => void }) {
  const { ano, metaLivros, lidosNoAno, lendo, queroLer } = resumo;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label mb-1">meta de {ano}</p>
          {metaLivros ? (
            <p className="font-serif text-2xl text-ink-900">
              {lidosNoAno} <span className="text-base text-muted-600">de {metaLivros} livros</span>
            </p>
          ) : (
            <p className="font-serif text-2xl text-ink-900">
              {lidosNoAno} <span className="text-base text-muted-600">{lidosNoAno === 1 ? "livro lido" : "livros lidos"}</span>
            </p>
          )}
        </div>
        <button type="button" onClick={onEditar} className="text-sm font-semibold text-brand-600 hover:underline">
          {metaLivros ? "editar meta" : "definir meta"}
        </button>
      </div>
      {metaLivros ? (
        <div className="mt-3">
          <ProgressBar atual={lidosNoAno} meta={metaLivros} />
          <p className="mt-1.5 text-xs text-muted-600">
            {lidosNoAno >= metaLivros
              ? "meta batida! 🎉"
              : `faltam ${metaLivros - lidosNoAno} — ${lendo} em andamento, ${queroLer} na fila`}
          </p>
        </div>
      ) : (
        <p className="mt-2 text-xs text-muted-600">
          {lendo} em andamento · {queroLer} na fila de quero ler
        </p>
      )}
    </div>
  );
}

function FormMeta({
  ano,
  atual,
  onSalvo,
}: {
  ano: number;
  atual: number | null;
  onSalvo: (r: EstanteResumoResponse) => void;
}) {
  const [valor, setValor] = useState(atual ? String(atual) : "12");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const n = Number(valor);
    if (!Number.isInteger(n) || n < 1 || n > 1000) {
      setErro("Escolha um número entre 1 e 1000.");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      onSalvo(await definirMetaAnual(ano, n));
    } catch (err) {
      setErro(extrairMensagemErro(err));
      setSalvando(false);
    }
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-4">
      {erro && <ErrorBanner mensagem={erro} />}
      <label>
        <span className="field-label">quantos livros você quer ler em {ano}?</span>
        <input
          type="number"
          min={1}
          max={1000}
          inputMode="numeric"
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="field-input"
        />
      </label>
      <Button type="submit" fullWidth loading={salvando}>
        salvar meta
      </Button>
    </form>
  );
}
