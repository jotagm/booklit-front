function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const tamanhos = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;

// Mesma paleta do app: a cor depende do id, então a pessoa tem sempre a mesma cor.
const CORES = ["#C17A3A", "#6B8F71", "#8E6C8A", "#5B7DB1", "#B5655A", "#8A7F3E", "#4F8A8B"];

export default function Avatar({
  nome,
  usuarioId,
  size = "md",
  className = "",
}: {
  nome: string;
  usuarioId?: number;
  size?: keyof typeof tamanhos;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-cream-50 ${tamanhos[size]} ${className}`}
      style={usuarioId === undefined ? undefined : { backgroundColor: CORES[Math.abs(usuarioId) % CORES.length] }}
      title={nome}
    >
      {iniciais(nome) || "?"}
    </div>
  );
}
