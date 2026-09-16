import { useState } from "react";
import { buscarLivrosGoogle } from "../api/leituras";
import { extrairMensagemErro } from "../api/client";
import Button from "./Button";
import { Spinner } from "./Feedback";

export interface LivroSelecionado {
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl: string | null;
}

// Busca livros na Google Books API (via proxy do backend) e permite escolher um.
export default function BookSearchPicker({
  onSelecionar,
  selecionado,
}: {
  onSelecionar: (livro: LivroSelecionado) => void;
  selecionado?: LivroSelecionado | null;
}) {
  const [termo, setTermo] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [resultados, setResultados] = useState<LivroSelecionado[]>([]);
  const [buscou, setBuscou] = useState(false);

  async function buscar() {
    if (!termo.trim()) return;
    setBuscando(true);
    setErro(null);
    try {
      const resposta = await buscarLivrosGoogle(termo.trim());
      setResultados(
        (resposta.items ?? []).map((item) => ({
          livroGoogleId: item.id,
          livroTitulo: item.volumeInfo.title,
          livroCapaUrl: item.volumeInfo.imageLinks?.thumbnail ?? null,
        }))
      );
      setBuscou(true);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível buscar livros agora."));
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div>
      <div className="flex gap-2">
        <input
          className="field-input"
          placeholder="Buscar livro pelo título..."
          value={termo}
          onChange={(e) => setTermo(e.target.value)}
          onKeyDown={(e) => {
            // Este componente é usado dentro de outros forms, então não tem um
            // <form> próprio. Sem isso, Enter submeteria o form de fora.
            if (e.key === "Enter") {
              e.preventDefault();
              buscar();
            }
          }}
        />
        <Button type="button" variant="secondary" loading={buscando} onClick={buscar}>
          Buscar
        </Button>
      </div>

      {selecionado && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-400 bg-brand-50 px-3 py-2">
          <Capa url={selecionado.livroCapaUrl} titulo={selecionado.livroTitulo} />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{selecionado.livroTitulo}</p>
            <p className="text-xs text-brand-600">livro selecionado</p>
          </div>
        </div>
      )}

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      {buscando && <Spinner />}

      {!buscando && buscou && resultados.length === 0 && (
        <p className="mt-3 text-sm text-muted-600">Nenhum resultado para "{termo}".</p>
      )}

      {!buscando && resultados.length > 0 && (
        <ul className="mt-3 max-h-72 space-y-2 overflow-y-auto">
          {resultados.map((livro) => (
            <li key={livro.livroGoogleId}>
              <button
                type="button"
                onClick={() => onSelecionar(livro)}
                className="flex w-full items-center gap-3 rounded-xl border border-ink-800/10 bg-cream-50 px-3 py-2 text-left hover:border-brand-400"
              >
                <Capa url={livro.livroCapaUrl} titulo={livro.livroTitulo} />
                <span className="truncate text-sm text-ink-900">{livro.livroTitulo}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Capa({ url, titulo }: { url: string | null; titulo: string }) {
  if (url) {
    return <img src={url} alt={titulo} className="h-12 w-9 shrink-0 rounded object-cover" />;
  }
  return (
    <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-ink-800/10 text-[9px] text-muted-600">
      capa
    </div>
  );
}
