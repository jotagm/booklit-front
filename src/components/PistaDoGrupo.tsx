import type { RegistroResponse, UsuarioId } from "../api/types";
import { corPorId } from "../utils/cores";

/**
 * Barra de progresso com o avatar de cada membro na posição em que está.
 * Preenchimento = seu progresso. Você ganha contorno ink-900 e fica por cima.
 */
export default function PistaDoGrupo({
  registros,
  meta,
  meuUsuarioId,
  tamanho = 22,
}: {
  registros: RegistroResponse[];
  meta: number;
  meuUsuarioId: UsuarioId | null;
  tamanho?: number;
}) {
  const pct = (v: number) => (meta > 0 ? Math.min(100, Math.max(0, (v / meta) * 100)) : 0);
  const meu = registros.find((r) => r.usuarioId === meuUsuarioId);
  const ordenados = registros.slice().sort((a, b) => Number(a.usuarioId === meuUsuarioId) - Number(b.usuarioId === meuUsuarioId));

  return (
    <div className="relative" style={{ height: tamanho + 14 }} role="img" aria-label="progresso do grupo">
      <div className="absolute inset-x-0 h-1.5 rounded-full bg-ink-800/10" style={{ top: tamanho + 2 }} />
      <div className="absolute left-0 h-1.5 rounded-full bg-brand-500 transition-all" style={{ top: tamanho + 2, width: `${pct(meu?.valorAtual ?? 0)}%` }} />
      {ordenados.map((r) => {
        const eu = r.usuarioId === meuUsuarioId;
        return (
          <span
            key={r.id}
            title={`${eu ? "você" : r.nomeUsuario} · ${r.valorAtual}/${meta}`}
            className="absolute top-0 overflow-hidden rounded-full border-2 transition-all"
            style={{
              width: tamanho,
              height: tamanho,
              left: `calc(${pct(r.valorAtual)}% - ${tamanho / 2}px)`,
              background: corPorId(r.usuarioId),
              borderColor: eu ? "#2B211B" : "#FBF9F4",
              zIndex: eu ? 2 : 1,
            }}
          >
            {r.fotoUrl && <img src={r.fotoUrl} alt="" className="h-full w-full object-cover" />}
          </span>
        );
      })}
    </div>
  );
}

/** "Ana e Carla estão à frente · Bruno vem logo atrás" */
export function resumoDaPista(registros: RegistroResponse[], meuUsuarioId: UsuarioId | null): string {
  const meu = registros.find((r) => r.usuarioId === meuUsuarioId)?.valorAtual ?? 0;
  const outros = registros.filter((r) => r.usuarioId !== meuUsuarioId);
  const nome = (r: RegistroResponse) => r.nomeUsuario.trim().split(/\s+/)[0];
  const juntar = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} e ${xs[xs.length - 1]}`);
  const frente = outros.filter((r) => r.valorAtual > meu).map(nome);
  const atras = outros.filter((r) => r.valorAtual < meu).sort((a, b) => b.valorAtual - a.valorAtual).map(nome);
  const partes: string[] = [];
  if (frente.length) partes.push(`${juntar(frente.slice(0, 2))}${frente.length > 2 ? ` e +${frente.length - 2}` : ""} ${frente.length === 1 ? "está" : "estão"} à frente`);
  if (atras.length) partes.push(`${atras[0]} vem logo atrás`);
  return partes.join(" · ") || "vocês estão no mesmo ponto";
}
