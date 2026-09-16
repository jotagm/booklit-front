import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { criarVotacao } from "../api/votacoes";
import { extrairMensagemErro } from "../api/client";
import { TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";
import { agoraMaisDias, paraInputDateTimeLocal, paraLocalDateTimeIso } from "../utils/date";

export default function VotacaoCreate() {
  const { clubeId } = useParams<{ clubeId: string }>();
  const navigate = useNavigate();

  const [dataAbertura, setDataAbertura] = useState(paraInputDateTimeLocal(new Date()));
  const [dataEncerramento, setDataEncerramento] = useState(paraInputDateTimeLocal(agoraMaisDias(5)));
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!clubeId) return;
    setErro(null);
    setEnviando(true);
    try {
      const votacao = await criarVotacao({
        clubeId,
        dataAbertura: paraLocalDateTimeIso(new Date(dataAbertura)),
        dataEncerramento: paraLocalDateTimeIso(new Date(dataEncerramento)),
      });
      navigate(`/votacoes/${votacao.id}`, { replace: true });
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível abrir a votação."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <Link to={`/clubes/${clubeId}`} className="text-sm text-muted-600 hover:text-ink-800">
        ← voltar
      </Link>
      <h1 className="mt-3 mb-1 font-serif text-2xl text-ink-900">votação do próximo livro</h1>
      <p className="mb-5 text-sm text-muted-600">o voto do líder vale 2 na apuração final.</p>

      {erro && (
        <div className="mb-4">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField
          label="abertura"
          type="datetime-local"
          value={dataAbertura}
          onChange={(e) => setDataAbertura(e.target.value)}
          required
        />
        <TextField
          label="encerramento"
          type="datetime-local"
          value={dataEncerramento}
          onChange={(e) => setDataEncerramento(e.target.value)}
          required
        />
        <Button type="submit" fullWidth loading={enviando} className="mt-1">
          abrir votação
        </Button>
      </form>
    </div>
  );
}
