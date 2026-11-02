import Avatar from "./Avatar";
import type { UsuarioId } from "../api/types";

export interface Pessoa {
  usuarioId: UsuarioId;
  nome: string;
  fotoUrl?: string | null;
}

/**
 * Rostos sobrepostos. `anel` é a cor do fundo onde a pilha está (cria o recorte entre avatares).
 * `vagas` desenha círculos tracejados para quem ainda falta (ex.: quem não votou).
 */
export default function FacePile({
  pessoas,
  max = 5,
  tamanho = 24,
  anel = "#FBF9F4",
  vagas = 0,
}: {
  pessoas: Pessoa[];
  max?: number;
  tamanho?: number;
  anel?: string;
  vagas?: number;
}) {
  const visiveis = pessoas.slice(0, max);
  const resto = pessoas.length - visiveis.length;
  const sobreposicao = Math.round(tamanho * 0.3);
  // Abaixo de 28px as iniciais não cabem com a sobreposição: fica só a cor.
  const base = { width: tamanho, height: tamanho, boxShadow: `0 0 0 2px ${anel}` };

  return (
    <span className="flex items-center">
      {visiveis.map((p, i) => (
        <span key={p.usuarioId} className="rounded-full" style={{ ...base, marginLeft: i ? -sobreposicao : 0 }}>
          <Avatar nome={p.nome} usuarioId={p.usuarioId} fotoUrl={p.fotoUrl} size="sm" className={`!h-full !w-full ${tamanho < 28 ? "!text-[0px]" : "!text-[10px]"}`} />
        </span>
      ))}
      {resto > 0 && (
        <span
          className="flex items-center justify-center rounded-full bg-cream-50 text-[10px] font-bold text-ink-800"
          style={{ ...base, marginLeft: -sobreposicao }}
        >
          +{resto}
        </span>
      )}
      {Array.from({ length: vagas }).map((_, i) => (
        <span
          key={`vaga-${i}`}
          className="rounded-full border-2 border-dashed border-ink-800/30"
          style={{ width: tamanho, height: tamanho, marginLeft: -Math.round(sobreposicao / 2) }}
        />
      ))}
    </span>
  );
}
