// O backend serializa LocalDateTime como string ISO sem timezone (ex: "2026-07-12T21:00:00").
// O construtor nativo do Date interpreta isso como horário local, que é o comportamento desejado aqui.

export function paraDate(iso: string | null | undefined): Date | null {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatarData(iso: string | null | undefined): string {
  const d = paraDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
}

export function formatarDataHora(iso: string | null | undefined): string {
  const d = paraDate(iso);
  if (!d) return "—";
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatarDataCurta(iso: string | null | undefined): string {
  const d = paraDate(iso);
  if (!d) return "—";
  return d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "");
}

// Converte um Date para o formato aceito pelo <input type="datetime-local">.
export function paraInputDateTimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(
    d.getMinutes()
  )}`;
}

// Serializa um Date no formato que o backend espera para LocalDateTime: horário local,
// sem sufixo de fuso.
//
// Usar toISOString() aqui é um erro silencioso: ele converte para UTC, e o Jackson desmonta
// o "Z" ao ler um LocalDateTime, gravando o horário deslocado pelo offset. No Brasil isso
// jogava o início da leitura 3 horas para a frente, e ela só ficava ativa depois disso.
export function paraLocalDateTimeIso(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
  );
}

export function agoraMaisDias(dias: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  return d;
}

export function estaNoIntervalo(inicio: string, fim: string, agora = new Date()): boolean {
  const di = paraDate(inicio);
  const df = paraDate(fim);
  if (!di || !df) return false;
  return agora >= di && agora <= df;
}

// ---- helpers usados pelo painel "meus clubes" (mock.pdf) ----

const MS_POR_DIA = 24 * 60 * 60 * 1000;

function meiaNoite(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function mesmoDia(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

// Dias inteiros até a data (0 = hoje, negativo = já passou).
export function diasAte(iso: string | null | undefined, agora = new Date()): number | null {
  const d = paraDate(iso);
  if (!d) return null;
  return Math.round((meiaNoite(d).getTime() - meiaNoite(agora).getTime()) / MS_POR_DIA);
}

export function rotuloPrazo(dias: number | null): string {
  if (dias === null) return "—";
  if (dias < 0) return "encerrado";
  if (dias === 0) return "hoje";
  if (dias === 1) return "1 dia";
  return `${dias} dias`;
}

// "há 2h", "há 1 dia" — mesmo formato do feed de atividade do mock.
export function tempoRelativo(iso: string | null | undefined, agora = new Date()): string {
  const d = paraDate(iso);
  if (!d) return "";
  const segundos = Math.max(0, Math.round((agora.getTime() - d.getTime()) / 1000));
  if (segundos < 60) return "agora";
  const minutos = Math.round(segundos / 60);
  if (minutos < 60) return `há ${minutos}min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `há ${horas}h`;
  const dias = Math.round(horas / 24);
  if (dias < 7) return dias === 1 ? "há 1 dia" : `há ${dias} dias`;
  const semanas = Math.round(dias / 7);
  if (semanas < 5) return semanas === 1 ? "há 1 semana" : `há ${semanas} semanas`;
  return formatarData(iso);
}

// "26 set" — usado nas metas e nos prazos.
export function formatarDiaMes(iso: string | null | undefined): string {
  const d = paraDate(iso);
  if (!d) return "—";
  // pt-BR devolve "26 de set."; o mock usa "26 set".
  return d
    .toLocaleDateString("pt-BR", { day: "numeric", month: "short" })
    .replace(" de ", " ")
    .replace(".", "");
}

// "quarta" — usado em "vote até quarta" (sem o "-feira", como no mock).
export function nomeDoDiaSemana(iso: string | null | undefined): string {
  const d = paraDate(iso);
  if (!d) return "";
  return d.toLocaleDateString("pt-BR", { weekday: "long" }).replace("-feira", "");
}

// Domingo da semana da data (o calendário do mock começa no domingo).
export function inicioDaSemana(d: Date): Date {
  const base = meiaNoite(d);
  base.setDate(base.getDate() - base.getDay());
  return base;
}

// Quantas semanas seguidas (incluindo a atual ou a anterior) tiveram atividade de leitura.
// Alimentado com as datas de atualização dos registros do usuário.
export function sequenciaDeSemanas(datas: Date[], agora = new Date()): number {
  if (datas.length === 0) return 0;

  const semanas = new Set(datas.map((d) => inicioDaSemana(d).getTime()));
  const cursor = inicioDaSemana(agora);

  // Se ainda não houve leitura nesta semana, a sequência não é quebrada: começa na anterior.
  if (!semanas.has(cursor.getTime())) cursor.setDate(cursor.getDate() - 7);

  let total = 0;
  while (semanas.has(cursor.getTime())) {
    total += 1;
    cursor.setDate(cursor.getDate() - 7);
  }
  return total;
}
