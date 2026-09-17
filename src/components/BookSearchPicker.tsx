import { useBuscaDeLivros } from "../hooks/useBuscaDeLivros";
import {
  CampoDeBuscaLivros,
  CapaDoLivro,
  SemResultados,
  fichaDoLivro,
} from "./BuscaDeLivros";
import { Spinner } from "./Feedback";

export interface LivroSelecionado {
  livroGoogleId: string;
  livroTitulo: string;
  livroCapaUrl: string | null;
  // Vem do Google quando disponível e serve para pré-preencher a meta em páginas.
  paginas?: number | null;
}

// Busca livros na Google Books API (via proxy do backend) e permite escolher um.
export default function BookSearchPicker({
  onSelecionar,
  selecionado,
}: {
  onSelecionar: (livro: LivroSelecionado) => void;
  selecionado?: LivroSelecionado | null;
}) {
  const busca = useBuscaDeLivros();

  return (
    <div>
      <CampoDeBuscaLivros busca={busca} placeholder="buscar por título, autor ou ISBN..." />

      {selecionado && (
        <div className="mt-3 flex items-center gap-3 rounded-xl border border-brand-400 bg-brand-50 px-3 py-2">
          {selecionado.livroCapaUrl ? (
            <img
              src={selecionado.livroCapaUrl}
              alt={selecionado.livroTitulo}
              className="h-12 w-9 shrink-0 rounded object-cover"
            />
          ) : (
            <div className="flex h-12 w-9 shrink-0 items-center justify-center rounded bg-ink-800/10 text-[9px] text-muted-600">
              capa
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-ink-900">{selecionado.livroTitulo}</p>
            <p className="text-xs text-brand-600">livro selecionado</p>
          </div>
        </div>
      )}

      {busca.erro && <p className="mt-2 text-xs text-red-600">{busca.erro}</p>}

      {busca.carregando && busca.resultados.length === 0 && <Spinner />}

      {!busca.carregando && busca.buscou && busca.resultados.length === 0 && <SemResultados busca={busca} />}

      {busca.resultados.length > 0 && (
        <>
          <ul className="mt-3 max-h-80 space-y-2 overflow-y-auto">
            {busca.resultados.map((item) => {
              const volume = item.volumeInfo;
              const ficha = fichaDoLivro(volume);

              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() =>
                      onSelecionar({
                        livroGoogleId: item.id,
                        livroTitulo: volume.title,
                        livroCapaUrl: volume.imageLinks?.thumbnail?.replace(/^http:/, "https:") ?? null,
                        paginas: volume.pageCount ?? null,
                      })
                    }
                    className={`flex w-full items-center gap-3 rounded-xl border bg-cream-50 px-3 py-2 text-left transition-colors hover:border-brand-400 ${
                      selecionado?.livroGoogleId === item.id ? "border-brand-400" : "border-ink-800/10"
                    }`}
                  >
                    <CapaDoLivro volume={volume} className="h-14 w-10" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink-900">{volume.title}</span>
                      {ficha && <span className="block truncate text-xs text-muted-600">{ficha}</span>}
                      {volume.pageCount ? (
                        <span className="block text-[11px] text-muted-500">{volume.pageCount} páginas</span>
                      ) : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          {busca.temMais && (
            <button
              type="button"
              onClick={busca.carregarMais}
              disabled={busca.carregando}
              className="mt-2 w-full rounded-xl border border-ink-800/10 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-500/5 disabled:opacity-50"
            >
              {busca.carregando ? "carregando..." : "carregar mais"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
