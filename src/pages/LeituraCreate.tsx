import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { criarLeitura } from "../api/leituras";
import { extrairMensagemErro } from "../api/client";
import type { TipoMeta } from "../api/types";
import BookSearchPicker, { type LivroSelecionado } from "../components/BookSearchPicker";
import { TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";
import { agoraMaisDias, paraInputDateTimeLocal, paraLocalDateTimeIso } from "../utils/date";

export default function LeituraCreate() {
  const { clubeId } = useParams<{ clubeId: string }>();
  const navigate = useNavigate();

  const [livro, setLivro] = useState<LivroSelecionado | null>(null);
  const [tipoMeta, setTipoMeta] = useState<TipoMeta>("PAGINA");
  const [valorMeta, setValorMeta] = useState(200);
  const [dataInicio, setDataInicio] = useState(paraInputDateTimeLocal(new Date()));
  const [dataFim, setDataFim] = useState(paraInputDateTimeLocal(agoraMaisDias(30)));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // O Google costuma informar o número de páginas do volume; usar isso como meta poupa
  // o líder de procurar a contagem na contracapa. Só preenche quando a meta é em páginas.
  function selecionarLivro(escolhido: LivroSelecionado) {
    setLivro(escolhido);
    if (tipoMeta === "PAGINA" && escolhido.paginas && escolhido.paginas > 0) {
      setValorMeta(escolhido.paginas);
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clubeId || !livro) return;
    setErro(null);
    setEnviando(true);
    try {
      await criarLeitura({
        clubeId,
        livroGoogleId: livro.livroGoogleId,
        livroTitulo: livro.livroTitulo,
        livroCapaUrl: livro.livroCapaUrl,
        tipoMeta,
        valorMeta,
        dataInicio: paraLocalDateTimeIso(new Date(dataInicio)),
        dataFim: paraLocalDateTimeIso(new Date(dataFim)),
      });
      navigate(`/clubes/${clubeId}`, { replace: true });
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível iniciar a leitura."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <Link to={`/clubes/${clubeId}`} className="text-sm text-muted-600 hover:text-ink-800">
        ← voltar
      </Link>
      <h1 className="mt-3 mb-5 font-serif text-2xl text-ink-900">nova leitura</h1>

      {erro && (
        <div className="mb-4">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <p className="field-label">livro</p>
          <BookSearchPicker selecionado={livro} onSelecionar={selecionarLivro} />
        </div>

        <div>
          <span className="field-label">meta de leitura</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setTipoMeta("PAGINA")}
              className={`rounded-xl border p-3 text-sm font-semibold ${
                tipoMeta === "PAGINA" ? "border-brand-500 bg-brand-50 text-ink-900" : "border-ink-800/10 bg-cream-50 text-muted-600"
              }`}
            >
              páginas
            </button>
            <button
              type="button"
              onClick={() => setTipoMeta("CAPITULO")}
              className={`rounded-xl border p-3 text-sm font-semibold ${
                tipoMeta === "CAPITULO" ? "border-brand-500 bg-brand-50 text-ink-900" : "border-ink-800/10 bg-cream-50 text-muted-600"
              }`}
            >
              capítulos
            </button>
          </div>
        </div>

        <TextField
          label={`quantidade de ${tipoMeta === "PAGINA" ? "páginas" : "capítulos"}`}
          type="number"
          min={1}
          value={valorMeta}
          onChange={(e) => setValorMeta(Number(e.target.value))}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <TextField
            label="início"
            type="datetime-local"
            value={dataInicio}
            onChange={(e) => setDataInicio(e.target.value)}
            required
          />
          <TextField
            label="fim (meta)"
            type="datetime-local"
            value={dataFim}
            onChange={(e) => setDataFim(e.target.value)}
            required
          />
        </div>

        <Button type="submit" fullWidth loading={enviando} disabled={!livro}>
          começar leitura
        </Button>
      </form>
    </div>
  );
}
