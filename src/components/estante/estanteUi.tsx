import type { StatusLeituraPessoal } from "../../api/types";

export const STATUS_ORDEM: StatusLeituraPessoal[] = ["LENDO", "QUERO_LER", "LIDO", "ABANDONADO"];

export const ROTULO_STATUS: Record<StatusLeituraPessoal, string> = {
  LENDO: "lendo",
  QUERO_LER: "quero ler",
  LIDO: "lido",
  ABANDONADO: "abandonado",
};

// Rótulo no plural para as abas da estante ("lidos", "abandonados").
export const ROTULO_ABA: Record<StatusLeituraPessoal, string> = {
  LENDO: "lendo",
  QUERO_LER: "quero ler",
  LIDO: "lidos",
  ABANDONADO: "abandonados",
};

export function Estrelas({
  nota,
  onChange,
  tamanho = "md",
}: {
  nota: number | null;
  onChange?: (nota: number | null) => void;
  tamanho?: "sm" | "md";
}) {
  const classe = tamanho === "sm" ? "text-sm" : "text-2xl";
  return (
    <span className={`inline-flex gap-0.5 ${classe}`} aria-label={nota ? `${nota} de 5 estrelas` : "sem nota"}>
      {[1, 2, 3, 4, 5].map((n) => {
        const cheia = nota != null && n <= nota;
        const estrela = <span className={cheia ? "text-brand-500" : "text-ink-800/20"}>★</span>;
        if (!onChange) return <span key={n}>{estrela}</span>;
        return (
          <button
            key={n}
            type="button"
            // Clicar na nota atual de novo limpa a avaliação.
            onClick={() => onChange(nota === n ? null : n)}
            className="leading-none transition-transform hover:scale-110"
            aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          >
            {estrela}
          </button>
        );
      })}
    </span>
  );
}
