import type { TipoMeta } from "../api/types";

export function rotuloTipoMeta(tipo: TipoMeta): string {
  return tipo === "PAGINA" ? "páginas" : "capítulos";
}

export function rotuloTipoMetaSingular(tipo: TipoMeta): string {
  return tipo === "PAGINA" ? "página" : "capítulo";
}
