import { Link } from "react-router-dom";
import type { LivroDoPerfil, PerfilResponse } from "../api/types";
import BookCover from "./BookCover";
import ProgressBar from "./ProgressBar";

const MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",
];

export function membroDesde(iso?: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return `no Booklit desde ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Números, leitura em andamento, últimos lidos e clubes — igual para o próprio perfil e o de outro leitor. */
export default function PerfilCorpo({ perfil }: { perfil: PerfilResponse }) {
  const meta = perfil.metaLivros ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <section className="card px-5 py-4">
        <div className="grid grid-cols-3 text-center">
          <Numero valor={perfil.lidosNoAno} rotulo={`lidos em ${perfil.ano}`} />
          <Numero valor={perfil.totalLidos} rotulo="lidos no total" />
          <Numero valor={perfil.clubes.length} rotulo={perfil.ehVoce ? "clubes" : "em comum"} />
        </div>
        {meta > 0 && (
          <div className="mt-4">
            <ProgressBar atual={perfil.lidosNoAno} meta={meta} />
            <p className="mt-1.5 text-xs text-muted-500">
              meta de {perfil.ano}: {perfil.lidosNoAno} de {meta} livros
            </p>
          </div>
        )}
      </section>

      {perfil.lendoAgora.length > 0 && (
        <section>
          <h2 className="section-label">lendo agora</h2>
          <ul className="flex flex-col gap-3">
            {perfil.lendoAgora.map((l, i) => (
              <LivroLendo key={`${l.titulo}-${i}`} livro={l} />
            ))}
          </ul>
        </section>
      )}

      {perfil.ultimosLidos.length > 0 && (
        <section>
          <h2 className="section-label">leu recentemente</h2>
          <div className="flex gap-3 overflow-x-auto pb-1">
            {perfil.ultimosLidos.map((l, i) => (
              <BookCover key={`${l.titulo}-${i}`} url={l.capaUrl} titulo={l.titulo} size="lg" />
            ))}
          </div>
        </section>
      )}

      {perfil.clubes.length > 0 && (
        <section>
          <h2 className="section-label">{perfil.ehVoce ? "seus clubes" : "clubes em comum"}</h2>
          <div className="flex flex-wrap gap-2">
            {perfil.clubes.map((c) => (
              <Link
                key={c.id}
                to={`/clubes/${c.id}`}
                className="rounded-full border border-ink-800/10 bg-cream-50 px-3.5 py-1.5 text-sm text-ink-900 hover:bg-ink-800/[0.04]"
              >
                {c.nome}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function Numero({ valor, rotulo }: { valor: number; rotulo: string }) {
  return (
    <div>
      <p className="font-serif text-2xl text-ink-900">{valor}</p>
      <p className="text-[11px] uppercase tracking-wide text-muted-500">{rotulo}</p>
    </div>
  );
}

function LivroLendo({ livro }: { livro: LivroDoPerfil }) {
  const total = livro.totalPaginas ?? 0;
  return (
    <li className="flex items-center gap-3">
      <BookCover url={livro.capaUrl} titulo={livro.titulo} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[15px] text-ink-900">{livro.titulo}</p>
        {livro.autor && <p className="truncate text-xs text-muted-600">{livro.autor}</p>}
        {total > 0 && (
          <div className="mt-2">
            <ProgressBar atual={livro.paginaAtual ?? 0} meta={total} />
          </div>
        )}
      </div>
    </li>
  );
}
