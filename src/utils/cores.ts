// Paleta única de identidade (pessoas e clubes). Mesma do Avatar.tsx e do app Flutter.
export const CORES = ["#C17A3A", "#6B8F71", "#8E6C8A", "#5B7DB1", "#B5655A", "#8A7F3E", "#4F8A8B"];

/** Cor estável a partir de um id numérico (usuário) ou UUID (clube). */
export function corPorId(id: number | string): string {
  if (typeof id === "number") return CORES[Math.abs(id) % CORES.length];
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return CORES[Math.abs(h) % CORES.length];
}

/** "1 ponto" / "3 pontos" — substitui os "(s)" espalhados pelas telas. */
export function plural(n: number, um: string, varios: string): string {
  return `${n} ${n === 1 ? um : varios}`;
}
