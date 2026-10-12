import { useEffect, useState } from "react";
import { listarEstante } from "../../api/estante";
import type { LeituraPessoalResponse } from "../../api/types";
import type { LivroSelecionado } from "../BookSearchPicker";
import BookCover from "../BookCover";

// Atalho na hora de sugerir livro para a votação: o "quero ler" da estante pessoal.
export default function SugestoesDaEstante({
  selecionado,
  onSelecionar,
  ignorar = [],
}: {
  selecionado: LivroSelecionado | null;
  onSelecionar: (l: LivroSelecionado) => void;
  ignorar?: string[];
}) {
  const [livros, setLivros] = useState<LeituraPessoalResponse[]>([]);

  useEffect(() => {
    let ativo = true;
    listarEstante("QUERO_LER")
      .then((l) => ativo && setLivros(l))
      .catch(() => {
        // Sem estante, a busca normal continua funcionando.
      });
    return () => {
      ativo = false;
    };
  }, []);

  const disponiveis = livros.filter((l) => !ignorar.includes(l.livroGoogleId));
  if (disponiveis.length === 0) return null;

  return (
    <div className="mb-4">
      <p className="field-label">da sua estante (quero ler)</p>
      <ul className="flex gap-2 overflow-x-auto pb-1">
        {disponiveis.map((l) => {
          const ativo = selecionado?.livroGoogleId === l.livroGoogleId;
          return (
            <li key={l.id} className="shrink-0">
              <button
                type="button"
                onClick={() =>
                  onSelecionar({
                    livroGoogleId: l.livroGoogleId,
                    livroTitulo: l.livroTitulo,
                    livroCapaUrl: l.livroCapaUrl,
                    paginas: l.totalPaginas,
                    livroAutor: l.livroAutor,
                  })
                }
                className={`flex w-24 flex-col items-center gap-1 rounded-xl border p-2 text-center transition-colors ${
                  ativo ? "border-brand-400 bg-brand-50" : "border-ink-800/10 hover:border-brand-400"
                }`}
                title={l.livroTitulo}
              >
                <BookCover url={l.livroCapaUrl} titulo={l.livroTitulo} size="sm" />
                <span className="line-clamp-2 text-[11px] leading-tight text-ink-800">{l.livroTitulo}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
