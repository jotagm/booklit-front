import { useEffect, useState } from "react";

/**
 * Substitui o <input type=number> + "salvar" da LeituraDetail.
 * − / +passo alteram o valor; salva sozinho 800ms depois do último toque (debounce),
 * então o usuário não precisa de um segundo clique. Tocar no número permite digitar.
 * Com `soAvanca` (leituras do clube) não desce abaixo do valor salvo: o backend recusa voltar.
 */
export default function StepperProgresso({
  valor,
  meta,
  unidade = "pág.",
  passo = 10,
  soAvanca = true,
  onSalvar,
}: {
  valor: number;
  meta: number;
  unidade?: string;
  passo?: number;
  soAvanca?: boolean;
  onSalvar: (novo: number) => Promise<void>;
}) {
  const [atual, setAtual] = useState(valor);
  const [salvando, setSalvando] = useState(false);
  useEffect(() => setAtual(valor), [valor]);
  const minimo = soAvanca ? valor : 0;

  useEffect(() => {
    // Digitando, o número pode passar por valores abaixo do mínimo: esses não são salvos.
    if (atual === valor || atual < minimo) return;
    const t = setTimeout(async () => {
      setSalvando(true);
      try {
        await onSalvar(atual);
      } finally {
        setSalvando(false);
      }
    }, 800);
    return () => clearTimeout(t);
  }, [atual, valor, minimo, onSalvar]);

  const limitar = (n: number) => Math.min(meta, Math.max(minimo, Math.round(n)));

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        aria-label="diminuir"
        onClick={() => setAtual((v) => limitar(v - 1))}
        disabled={atual <= minimo}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink-800/15 text-xl text-ink-800 hover:bg-ink-800/5 disabled:opacity-40 disabled:hover:bg-transparent"
      >
        −
      </button>
      <label className="flex-1 text-center">
        <input
          type="number"
          inputMode="numeric"
          value={atual}
          min={0}
          max={meta}
          onChange={(e) => setAtual(Math.min(meta, Math.max(0, Math.round(Number(e.target.value)))))}
          onBlur={() => setAtual((v) => limitar(v))}
          className="w-20 bg-transparent text-center font-serif text-[32px] font-bold text-ink-900 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
        <span className="text-sm text-muted-500">
          / {meta} {unidade}
        </span>
        <span className="block h-4 text-[11px] text-muted-500">{salvando ? "salvando…" : ""}</span>
      </label>
      <button
        type="button"
        onClick={() => setAtual((v) => limitar(v + passo))}
        className="h-10 shrink-0 rounded-full bg-brand-500 px-3.5 text-sm font-semibold text-cream-50 hover:bg-brand-600"
      >
        +{passo}
      </button>
    </div>
  );
}
