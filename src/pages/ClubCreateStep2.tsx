import { useState } from "react";
import type { FormEvent } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { criarConvite } from "../api/convites";
import { extrairMensagemErro } from "../api/client";
import { agoraMaisDias, paraLocalDateTimeIso } from "../utils/date";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";

interface ConviteEnviado {
  email: string;
  status: "enviado" | "erro";
  mensagem?: string;
}

export default function ClubCreateStep2() {
  const { clubeId } = useParams<{ clubeId: string }>();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { nomeClube?: string } };
  const nomeClube = location.state?.nomeClube ?? "seu clube";

  const [email, setEmail] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [enviados, setEnviados] = useState<ConviteEnviado[]>([]);

  async function convidar(e: FormEvent) {
    e.preventDefault();
    if (!clubeId || !email.trim()) return;
    setErro(null);
    setEnviando(true);
    try {
      await criarConvite({
        clubeId,
        emailDestinatario: email.trim(),
        expiraEm: paraLocalDateTimeIso(agoraMaisDias(7)),
      });
      setEnviados((prev) => [{ email: email.trim(), status: "enviado" }, ...prev]);
      setEmail("");
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível enviar o convite."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <span className="text-sm text-transparent select-none">.</span>
        <h1 className="font-serif text-lg text-ink-900">novo clube</h1>
        <span className="text-sm text-transparent select-none">.</span>
      </div>

      <div className="mb-5 flex items-center justify-center gap-1.5">
        <span className="h-1.5 w-6 rounded-full bg-ink-800/15" />
        <span className="h-1.5 w-6 rounded-full bg-brand-500" />
      </div>

      <div className="flex flex-col items-center text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl text-cream-50">
          +
        </div>
        <h2 className="mt-3 font-serif text-xl text-ink-900">{nomeClube}</h2>
        <p className="mt-1 text-sm text-muted-600">clube criado — convide os membros</p>
      </div>

      <div className="card mt-6 p-4">
        <p className="field-label">convidar por e-mail</p>
        <form onSubmit={convidar} className="mt-1 flex gap-2">
          <input
            type="email"
            className="field-input"
            placeholder="pessoa@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={enviando} className="shrink-0">
            enviar
          </Button>
        </form>
        <p className="mt-2 text-xs text-muted-500">o convite expira em 7 dias.</p>

        {erro && (
          <div className="mt-3">
            <ErrorBanner mensagem={erro} />
          </div>
        )}

        {enviados.length > 0 && (
          <ul className="mt-4 flex flex-col gap-2 border-t border-ink-800/10 pt-3">
            {enviados.map((c, i) => (
              <li key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink-800">{c.email}</span>
                <span className="text-xs font-semibold text-brand-600">convite enviado</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button
        variant="secondary"
        fullWidth
        className="mt-6"
        onClick={() => navigate(`/clubes/${clubeId}`, { replace: true })}
      >
        ir para o clube
      </Button>
    </div>
  );
}
