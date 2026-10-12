import { useState } from "react";
import type { LeituraPessoalResponse, StatusLeituraPessoal } from "../../api/types";
import { adicionarNaEstante } from "../../api/estante";
import { extrairMensagemErro } from "../../api/client";
import type { LivroSelecionado } from "../BookSearchPicker";
import BookSearchPicker from "../BookSearchPicker";
import Button from "../Button";
import { ErrorBanner } from "../Feedback";
import { ROTULO_STATUS } from "./estanteUi";

const OPCOES: StatusLeituraPessoal[] = ["QUERO_LER", "LENDO", "LIDO"];

// Escolher em que prateleira o livro entra. Usado no modal da estante e no detalhe
// de um livro em "explorar livros".
export function EscolhaDeStatus({
  livro,
  onAdicionado,
  statusInicial = "QUERO_LER",
}: {
  livro: LivroSelecionado;
  onAdicionado: (l: LeituraPessoalResponse) => void;
  statusInicial?: StatusLeituraPessoal;
}) {
  const [status, setStatus] = useState<StatusLeituraPessoal>(statusInicial);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function adicionar() {
    setErro(null);
    setSalvando(true);
    try {
      const nova = await adicionarNaEstante({
        livroGoogleId: livro.livroGoogleId,
        livroTitulo: livro.livroTitulo,
        livroAutor: livro.livroAutor ?? null,
        livroCapaUrl: livro.livroCapaUrl,
        totalPaginas: livro.paginas ?? null,
        status,
      });
      onAdicionado(nova);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível adicionar o livro."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {erro && <ErrorBanner mensagem={erro} />}
      <div className="flex gap-2">
        {OPCOES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatus(s)}
            className={`flex-1 rounded-xl border px-2 py-2 text-sm font-medium transition-colors ${
              status === s
                ? "border-brand-400 bg-brand-50 text-brand-700"
                : "border-ink-800/15 text-ink-800 hover:bg-ink-800/5"
            }`}
          >
            {ROTULO_STATUS[s]}
          </button>
        ))}
      </div>
      <Button fullWidth loading={salvando} onClick={adicionar}>
        adicionar à estante
      </Button>
    </div>
  );
}

export default function AdicionarNaEstante({ onAdicionado }: { onAdicionado: (l: LeituraPessoalResponse) => void }) {
  const [livro, setLivro] = useState<LivroSelecionado | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <BookSearchPicker selecionado={livro} onSelecionar={setLivro} />
      {livro && <EscolhaDeStatus key={livro.livroGoogleId} livro={livro} onAdicionado={onAdicionado} />}
    </div>
  );
}
