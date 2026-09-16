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

export default function Avatar({
  nome,
  size = "md",
  className = "",
}: {
  nome: string;
  size?: keyof typeof tamanhos;
  className?: string;
}) {
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full bg-brand-500 font-semibold text-cream-50 ${tamanhos[size]} ${className}`}
      title={nome}
    >
      {iniciais(nome) || "?"}
    </div>
  );
}
