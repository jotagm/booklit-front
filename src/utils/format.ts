import type { TipoMeta } from "../api/types";

export function rotuloTipoMeta(tipo: TipoMeta): string {
  return tipo === "PAGINA" ? "páginas" : "capítulos";
}

export function rotuloTipoMetaSingular(tipo: TipoMeta): string {
  return tipo === "PAGINA" ? "página" : "capítulo";
}

/**
 * Leitura que o clube escolheu (votação encerrada) e o líder ainda não completou: nasce sem
 * meta e sem datas, então não fica "ativa" até ele definir.
 */
export function leituraADefinir(l: { dataInicio?: string | null; dataFim?: string | null; valorMeta: number }): boolean {
  return !l.dataInicio || !l.dataFim || l.valorMeta <= 0;
}
