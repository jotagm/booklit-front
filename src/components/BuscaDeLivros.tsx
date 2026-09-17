import type { VolumeInfo } from "../api/types";
import type { useBuscaDeLivros } from "../hooks/useBuscaDeLivros";
import { CAMPOS } from "../hooks/useBuscaDeLivros";
import Button from "./Button";

type Busca = ReturnType<typeof useBuscaDeLivros>;

// "2017-05-31" / "2017-05" / "2017" -> "2017"
export function anoDe(publishedDate?: string | null): string | null {
  if (!publishedDate) return null;
  const ano = publishedDate.slice(0, 4);
  return /^\d{4}$/.test(ano) ? ano : null;
}

// "Frank Herbert · 2017 · Aleph" — o que permite distinguir duas edições do mesmo livro.
export function fichaDoLivro(volume: VolumeInfo): string {
  return [volume.authors?.join(", "), anoDe(volume.publishedDate), volume.publisher]
    .filter(Boolean)
    .join(" · ");
}

export function CampoDeBuscaLivros({
  busca,
  placeholder = "buscar livro...",
}: {
  busca: Busca;
  placeholder?: string;
}) {
  return (
    <div>
      <div className="flex gap-2">
        <input
          className="field-input"
          placeholder={placeholder}
          value={busca.termo}
          onChange={(e) => busca.setTermo(e.target.value)}
          onKeyDown={(e) => {
            // O seletor é usado dentro de outros forms e não tem um <form> próprio.
            // Sem isso, Enter submeteria o form de fora.
            if (e.key === "Enter") {
              e.preventDefault();
              busca.buscar();
            }
          }}
        />
        <Button type="button" variant="secondary" loading={busca.carregando} onClick={() => busca.buscar()}>
          buscar
        </Button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        {CAMPOS.map(({ valor, rotulo }) => (
          <button
            key={valor}
            type="button"
            onClick={() => busca.setCampo(valor)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
              busca.campo === valor
                ? "bg-brand-500 text-cream-50"
                : "bg-ink-800/[0.06] text-muted-700 hover:bg-ink-800/10"
            }`}
          >
            {rotulo}
          </button>
        ))}

        <button
          type="button"
          onClick={busca.alternarIdioma}
          className="ml-auto text-xs font-semibold text-brand-600 hover:underline"
        >
          {busca.soEmPortugues ? "buscar em todos os idiomas" : "só em português"}
        </button>
      </div>
    </div>
  );
}

export function CapaDoLivro({
  volume,
  className = "h-16 w-11",
}: {
  volume: VolumeInfo;
  className?: string;
}) {
  // O Google devolve as capas em http; sem o https o navegador bloqueia como conteúdo misto.
  const url = volume.imageLinks?.thumbnail?.replace(/^http:/, "https:");

  if (url) {
    return <img src={url} alt={volume.title} className={`${className} shrink-0 rounded-lg object-cover`} />;
  }
  return (
    <div
      className={`${className} shrink-0 rounded-lg`}
      style={{ backgroundImage: "repeating-linear-gradient(45deg, #F3D9BC 0 5px, #FBEEE2 5px 10px)" }}
      role="img"
      aria-label={`capa de ${volume.title}`}
    />
  );
}

export function SemResultados({ busca }: { busca: Busca }) {
  return (
    <p className="mt-4 text-sm text-muted-600">
      Nenhum resultado para "{busca.termo}".
      {busca.soEmPortugues && (
        <>
          {" "}
          <button
            type="button"
            onClick={busca.alternarIdioma}
            className="font-semibold text-brand-600 hover:underline"
          >
            Tentar em todos os idiomas
          </button>
        </>
      )}
      {busca.campo !== "TUDO" && (
        <>
          {" "}
          <button
            type="button"
            onClick={() => busca.setCampo("TUDO")}
            className="font-semibold text-brand-600 hover:underline"
          >
            Buscar em todos os campos
          </button>
        </>
      )}
    </p>
  );
}
