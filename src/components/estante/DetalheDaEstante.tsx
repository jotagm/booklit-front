import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router-dom";
import type { LeituraPessoalResponse, StatusLeituraPessoal } from "../../api/types";
import {
  atualizarProgressoNaEstante,
  avaliarNaEstante,
  mudarStatusNaEstante,
  removerDaEstante,
} from "../../api/estante";
import { extrairMensagemErro } from "../../api/client";
import BookCover from "../BookCover";
import Button from "../Button";
import ProgressBar from "../ProgressBar";
import { ErrorBanner } from "../Feedback";
import { TextAreaField } from "../TextField";
import { Estrelas, ROTULO_STATUS, STATUS_ORDEM } from "./estanteUi";

// Conteúdo do modal de um livro da estante: status, progresso, nota/resenha e remover.
// Cada bloco salva sozinho — a pessoa normalmente só quer mexer em uma coisa.
export default function DetalheDaEstante({
  leitura,
  onAtualizado,
  onRemovido,
}: {
  leitura: LeituraPessoalResponse;
  onAtualizado: (l: LeituraPessoalResponse) => void;
  onRemovido: (id: string) => void;
}) {
  const [erro, setErro] = useState<string | null>(null);
  const [pagina, setPagina] = useState(String(leitura.paginaAtual));
  const [total, setTotal] = useState(leitura.totalPaginas ? String(leitura.totalPaginas) : "");
  const [nota, setNota] = useState<number | null>(leitura.nota);
  const [resenha, setResenha] = useState(leitura.resenha ?? "");
  const [salvando, setSalvando] = useState<"status" | "progresso" | "avaliacao" | "remover" | null>(null);
  const [confirmandoRemocao, setConfirmandoRemocao] = useState(false);

  async function executar(
    tipo: "status" | "progresso" | "avaliacao",
    acao: () => Promise<LeituraPessoalResponse>
  ) {
    setErro(null);
    setSalvando(tipo);
    try {
      const atualizada = await acao();
      onAtualizado(atualizada);
      setPagina(String(atualizada.paginaAtual));
      setTotal(atualizada.totalPaginas ? String(atualizada.totalPaginas) : "");
    } catch (e) {
      setErro(extrairMensagemErro(e));
    } finally {
      setSalvando(null);
    }
  }

  function mudarStatus(status: StatusLeituraPessoal) {
    if (status === leitura.status) return;
    executar("status", () => mudarStatusNaEstante(leitura.id, status));
  }

  function salvarProgresso(e: FormEvent) {
    e.preventDefault();
    const paginaNum = Number(pagina);
    const totalNum = total ? Number(total) : null;
    if (!Number.isInteger(paginaNum) || paginaNum < 0) {
      setErro("Informe uma página válida.");
      return;
    }
    executar("progresso", () => atualizarProgressoNaEstante(leitura.id, paginaNum, totalNum));
  }

  function salvarAvaliacao(e: FormEvent) {
    e.preventDefault();
    executar("avaliacao", () => avaliarNaEstante(leitura.id, nota, resenha.trim() || null));
  }

  async function remover() {
    setSalvando("remover");
    try {
      await removerDaEstante(leitura.id);
      onRemovido(leitura.id);
    } catch (e) {
      setErro(extrairMensagemErro(e));
      setSalvando(null);
    }
  }

  const mostraAvaliacao = leitura.status === "LIDO" || leitura.status === "ABANDONADO" || leitura.nota != null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex gap-3">
        <BookCover url={leitura.livroCapaUrl} titulo={leitura.livroTitulo} size="lg" />
        <div className="min-w-0">
          {leitura.livroAutor && <p className="text-sm text-muted-600">{leitura.livroAutor}</p>}
          {leitura.clubeOrigemId && (
            <Link to={`/clubes/${leitura.clubeOrigemId}`} className="chip-suave mt-1.5">
              lido com o clube
            </Link>
          )}
          {leitura.dataInicio && (
            <p className="mt-1.5 text-xs text-muted-500">
              começou em {new Date(`${leitura.dataInicio}T00:00:00`).toLocaleDateString("pt-BR")}
              {leitura.dataFim &&
                ` · ${leitura.status === "ABANDONADO" ? "parou" : "terminou"} em ${new Date(
                  `${leitura.dataFim}T00:00:00`
                ).toLocaleDateString("pt-BR")}`}
            </p>
          )}
        </div>
      </div>

      {erro && <ErrorBanner mensagem={erro} />}

      <div>
        <p className="field-label">status</p>
        <div className="grid grid-cols-2 gap-2">
          {STATUS_ORDEM.map((s) => (
            <button
              key={s}
              type="button"
              disabled={salvando !== null}
              onClick={() => mudarStatus(s)}
              className={`rounded-xl border px-3 py-2 text-sm font-medium transition-colors disabled:opacity-60 ${
                leitura.status === s
                  ? "border-brand-400 bg-brand-50 text-brand-700"
                  : "border-ink-800/15 text-ink-800 hover:bg-ink-800/5"
              }`}
            >
              {ROTULO_STATUS[s]}
            </button>
          ))}
        </div>
      </div>

      {leitura.status !== "QUERO_LER" && (
        <form onSubmit={salvarProgresso}>
          <p className="field-label">progresso</p>
          {leitura.totalPaginas ? (
            <div className="mb-3">
              <ProgressBar atual={leitura.paginaAtual} meta={leitura.totalPaginas} />
              <p className="mt-1 text-xs text-muted-600">
                página {leitura.paginaAtual} de {leitura.totalPaginas}
                {leitura.percentual != null && ` · ${leitura.percentual}%`}
              </p>
            </div>
          ) : null}
          <div className="flex items-end gap-2">
            <label className="flex-1">
              <span className="text-xs text-muted-600">estou na página</span>
              <input
                type="number"
                min={0}
                inputMode="numeric"
                value={pagina}
                onChange={(e) => setPagina(e.target.value)}
                className="field-input mt-1 py-2"
              />
            </label>
            <label className="flex-1">
              <span className="text-xs text-muted-600">de (total)</span>
              <input
                type="number"
                min={1}
                inputMode="numeric"
                placeholder="?"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                className="field-input mt-1 py-2"
              />
            </label>
            <Button type="submit" loading={salvando === "progresso"} className="px-4 py-2">
              salvar
            </Button>
          </div>
        </form>
      )}

      {mostraAvaliacao && (
        <form onSubmit={salvarAvaliacao} className="flex flex-col gap-3">
          <div>
            <p className="field-label">sua nota</p>
            <Estrelas nota={nota} onChange={setNota} />
          </div>
          <TextAreaField
            label="resenha (só você vê)"
            maxLength={5000}
            placeholder="o que achou do livro?"
            value={resenha}
            onChange={(e) => setResenha(e.target.value)}
          />
          <Button type="submit" variant="secondary" loading={salvando === "avaliacao"}>
            salvar avaliação
          </Button>
        </form>
      )}

      <div className="border-t border-ink-800/10 pt-3">
        {confirmandoRemocao ? (
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-muted-600">tirar da estante?</span>
            <div className="flex gap-2">
              <Button variant="secondary" className="px-4 py-2" onClick={() => setConfirmandoRemocao(false)}>
                não
              </Button>
              <Button variant="danger" className="px-4 py-2" loading={salvando === "remover"} onClick={remover}>
                remover
              </Button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmandoRemocao(true)}
            className="text-sm font-semibold text-red-600 hover:underline"
          >
            remover da estante
          </button>
        )}
      </div>
    </div>
  );
}
