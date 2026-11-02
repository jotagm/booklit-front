import { Link } from "react-router-dom";
import type { LivroDoPerfil, PerfilResponse } from "../api/types";
import BookCover from "./BookCover";
import ProgressBar from "./ProgressBar";
import { corPorId } from "../utils/cores";

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

/**
 * Números numa linha, estante (leu recentemente + meta), leitura em andamento e clubes —
 * igual para o próprio perfil e o de outro leitor. `semanas` (sequência) só existe no seu.
 */
export default function PerfilCorpo({ perfil, semanas = 0 }: { perfil: PerfilResponse; semanas?: number }) {
  const meta = perfil.metaLivros ?? 0;
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1 text-[13px] text-muted-600">
        <span>
          <strong className="font-serif text-lg text-ink-900">{perfil.lidosNoAno}</strong> lidos em {perfil.ano}
        </span>
        <span>
          <strong className="font-serif text-lg text-ink-900">{perfil.totalLidos}</strong> no total
        </span>
        {semanas > 0 && (
          <span>
            <strong className="font-serif text-lg text-brand-500">🔥 {semanas}</strong>{" "}
            {semanas === 1 ? "semana" : "semanas"}
          </span>
        )}
      </div>

      {(perfil.ultimosLidos.length > 0 || meta > 0) && (
        <section>
          <h2 className="section-label">estante · leu recentemente</h2>
          {perfil.ultimosLidos.length > 0 && (
            <div className="sem-scrollbar -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0">
              {perfil.ultimosLidos.map((l, i) => (
                <BookCover key={`${l.titulo}-${i}`} url={l.capaUrl} titulo={l.titulo} className="!h-[92px] !w-16" />
              ))}
            </div>
          )}
          {meta > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-muted-600">
                <span>meta de {perfil.ano}</span>
                <span>
                  {perfil.lidosNoAno} de {meta}
                </span>
              </div>
              <ProgressBar atual={perfil.lidosNoAno} meta={meta} />
            </div>
          )}
        </section>
      )}

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

      {perfil.clubes.length > 0 && (
        <section>
          <h2 className="section-label">{perfil.ehVoce ? "clubes" : "clubes em comum"}</h2>
          <div className="flex flex-wrap gap-2">
            {perfil.clubes.map((c) => (
              <Link
                key={c.id}
                to={`/clubes/${c.id}`}
                className="flex items-center gap-2 rounded-full border border-ink-800/10 bg-cream-50 py-1.5 pl-1.5 pr-3.5 text-sm text-ink-900 hover:bg-ink-800/[0.04]"
              >
                <span className="h-[22px] w-[22px] rounded-[7px]" style={{ background: corPorId(c.id) }} />
                {c.nome}
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function LivroLendo({ livro }: { livro: LivroDoPerfil }) {
  const total = livro.totalPaginas ?? 0;
  return (
    <li className="card flex items-center gap-3 p-3.5">
      <BookCover url={livro.capaUrl} titulo={livro.titulo} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate font-serif text-[17px] text-ink-900">{livro.titulo}</p>
        {/* Mock 1e: "com Clube do Café · pág. 118"; leitura só pessoal mostra o autor. */}
        <p className="truncate text-xs text-muted-600">
          {[
            livro.clube ? `com ${livro.clube}` : livro.autor,
            livro.paginaAtual ? `pág. ${livro.paginaAtual}` : null,
          ]
            .filter(Boolean)
            .join(" · ")}
        </p>
        {total > 0 && (
          <div className="mt-2">
            <ProgressBar atual={livro.paginaAtual ?? 0} meta={total} />
          </div>
        )}
      </div>
    </li>
  );
}
