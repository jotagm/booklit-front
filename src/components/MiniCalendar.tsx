import { mesmoDia, paraDate } from "../utils/date";

const DIAS_DA_SEMANA = ["D", "S", "T", "Q", "Q", "S", "S"];

// Calendário do mês corrente com um ponto nos dias que têm prazo (fim de leitura
// ou encerramento de votação), como no painel do mock.
export default function MiniCalendar({
  marcos = [],
  hoje = new Date(),
}: {
  marcos?: { data: string }[];
  hoje?: Date;
}) {
  const ano = hoje.getFullYear();
  const mes = hoje.getMonth();

  const primeiroDia = new Date(ano, mes, 1);
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const vazios = primeiroDia.getDay();

  const datasMarcadas = marcos
    .map((m) => paraDate(m.data))
    .filter((d): d is Date => d !== null && d.getFullYear() === ano && d.getMonth() === mes);

  const celulas: (number | null)[] = [
    ...Array.from({ length: vazios }, () => null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const nomeDoMes = primeiroDia.toLocaleDateString("pt-BR", { month: "long" });

  return (
    <section>
      <h2 className="section-label">{nomeDoMes}</h2>
      <div className="card px-3 py-4">
        <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-muted-400">
          {DIAS_DA_SEMANA.map((d, i) => (
            <span key={i} className="py-1">
              {d}
            </span>
          ))}
        </div>

        <div className="grid grid-cols-7 text-center text-sm text-ink-800">
          {celulas.map((dia, i) => {
            if (dia === null) return <span key={`vazio-${i}`} className="py-1.5" />;

            const data = new Date(ano, mes, dia);
            const ehHoje = mesmoDia(data, hoje);
            const temMarco = datasMarcadas.some((d) => mesmoDia(d, data));
            const passou = data < hoje && !ehHoje;

            return (
              <span key={dia} className="flex flex-col items-center py-1">
                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-full ${
                    ehHoje ? "bg-brand-500 font-semibold text-cream-50" : ""
                  }`}
                >
                  {dia}
                </span>
                <span
                  className={`mt-0.5 h-1 w-1 rounded-full ${
                    temMarco ? (passou ? "bg-muted-400" : "bg-brand-500") : "bg-transparent"
                  }`}
                />
              </span>
            );
          })}
        </div>
      </div>
    </section>
  );
}
