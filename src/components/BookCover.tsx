const tamanhos = {
  sm: "h-14 w-10",
  md: "h-16 w-11",
  lg: "h-20 w-14",
} as const;

// Sem capa, o mock usa um retângulo com listras diagonais claras no lugar do livro.
const listras = {
  backgroundImage:
    "repeating-linear-gradient(45deg, #F3D9BC 0 5px, #FBEEE2 5px 10px)",
};

export default function BookCover({
  url,
  titulo,
  size = "md",
  className = "",
}: {
  url?: string | null;
  titulo: string;
  size?: keyof typeof tamanhos;
  className?: string;
}) {
  const base = `${tamanhos[size]} shrink-0 rounded-lg object-cover ${className}`;

  if (url) return <img src={url} alt={titulo} className={base} />;

  return <div className={base} style={listras} role="img" aria-label={`capa de ${titulo}`} />;
}
