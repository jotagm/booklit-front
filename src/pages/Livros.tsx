import { useState } from "react";
import type { GoogleBooksItem } from "../api/types";
import { useBuscaDeLivros } from "../hooks/useBuscaDeLivros";
import { CampoDeBuscaLivros, CapaDoLivro, SemResultados, anoDe, fichaDoLivro } from "../components/BuscaDeLivros";
import Modal from "../components/Modal";
import { Spinner, ErrorBanner } from "../components/Feedback";

// Tela de explorar o catálogo fora dos fluxos de criar leitura e sugerir livro — que até
// aqui eram os dois únicos lugares do app com busca de livros.
export default function Livros() {
  const busca = useBuscaDeLivros();
  const [detalhe, setDetalhe] = useState<GoogleBooksItem | null>(null);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <h1 className="mb-1 font-serif text-[28px] font-bold text-ink-900 lg:text-4xl">livros</h1>
      <p className="mb-6 text-sm text-muted-600">
        procure por título, autor ou ISBN para decidir a próxima leitura do clube
      </p>

      <div className="max-w-2xl">
        <CampoDeBuscaLivros busca={busca} placeholder="ex: Duna, Ursula K. Le Guin, 9788576573180" />
      </div>

      {busca.erro && (
        <div className="mt-4 max-w-2xl">
          <ErrorBanner mensagem={busca.erro} />
        </div>
      )}

      {busca.carregando && busca.resultados.length === 0 && <Spinner label="buscando..." />}

      {!busca.carregando && !busca.buscou && (
        <p className="mt-10 text-center text-sm text-muted-500">
          nada buscado ainda — comece digitando acima
        </p>
      )}

      {!busca.carregando && busca.buscou && busca.resultados.length === 0 && <SemResultados busca={busca} />}

      {busca.resultados.length > 0 && (
        <>
          <p className="mb-3 mt-6 text-xs text-muted-500">
            {busca.total > busca.resultados.length
              ? `${busca.resultados.length} de ${busca.total} resultados`
              : `${busca.resultados.length} resultado(s)`}
          </p>

          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {busca.resultados.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setDetalhe(item)}
                  className="card flex h-full w-full gap-4 p-4 text-left transition-shadow hover:shadow-md"
                >
                  <CapaDoLivro volume={item.volumeInfo} className="h-24 w-16" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-lg leading-tight text-ink-900">
                      {item.volumeInfo.title}
                    </span>
                    {item.volumeInfo.subtitle && (
                      <span className="mt-0.5 block text-xs text-muted-600">{item.volumeInfo.subtitle}</span>
                    )}
                    <span className="mt-1.5 block text-xs text-muted-600">{fichaDoLivro(item.volumeInfo)}</span>
                    {item.volumeInfo.pageCount ? (
                      <span className="mt-1 block text-[11px] text-muted-500">
                        {item.volumeInfo.pageCount} páginas
                      </span>
                    ) : null}
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {busca.temMais && (
            <div className="mt-6 flex justify-center">
              <button
                type="button"
                onClick={busca.carregarMais}
                disabled={busca.carregando}
                className="rounded-full border border-ink-800/15 px-6 py-2.5 text-sm font-semibold text-ink-800 hover:bg-ink-800/5 disabled:opacity-50"
              >
                {busca.carregando ? "carregando..." : "carregar mais"}
              </button>
            </div>
          )}
        </>
      )}

      {detalhe && (
        <Modal aberto onFechar={() => setDetalhe(null)} titulo={detalhe.volumeInfo.title}>
          <DetalheDoLivro item={detalhe} />
        </Modal>
      )}
    </div>
  );
}

function DetalheDoLivro({ item }: { item: GoogleBooksItem }) {
  const volume = item.volumeInfo;

  return (
    <div>
      <div className="flex gap-4">
        <CapaDoLivro volume={volume} className="h-32 w-24" />
        <div className="min-w-0 flex-1 text-sm">
          {volume.subtitle && <p className="mb-1 text-muted-700">{volume.subtitle}</p>}
          <Linha rotulo="autor" valor={volume.authors?.join(", ")} />
          <Linha rotulo="editora" valor={volume.publisher} />
          <Linha rotulo="ano" valor={anoDe(volume.publishedDate)} />
          <Linha rotulo="páginas" valor={volume.pageCount ? String(volume.pageCount) : null} />
          <Linha rotulo="idioma" valor={volume.language} />
        </div>
      </div>

      {volume.description && (
        <p className="mt-4 max-h-56 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-muted-700">
          {/* A descrição do Google vem com HTML às vezes; as tags são removidas para não
              renderizar marcação de terceiro dentro do app. */}
          {volume.description.replace(/<[^>]*>/g, "")}
        </p>
      )}

      {volume.infoLink && (
        <a
          href={volume.infoLink}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-block text-sm font-semibold text-brand-600 hover:underline"
        >
          ver no Google Books →
        </a>
      )}
    </div>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string | null }) {
  if (!valor) return null;
  return (
    <p className="text-muted-700">
      <span className="text-xs uppercase tracking-wide text-muted-500">{rotulo}: </span>
      {valor}
    </p>
  );
}
