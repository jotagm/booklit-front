import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { criarClube } from "../api/clubes";
import { extrairMensagemErro } from "../api/client";
import { TextAreaField, TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";

const LIMITE_DESCRICAO = 120;

export default function ClubCreateStep1() {
  const navigate = useNavigate();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [privacidade, setPrivacidade] = useState<"fechado" | "publico">("fechado");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const clube = await criarClube({
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        privado: true, // "público" está fora do MVP (ver mockup) — todo clube nasce fechado, só por convite
        temaIds: [],
      });
      navigate(`/clubes/novo/${clube.id}/convidar`, { state: { nomeClube: clube.nome } });
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível criar o clube."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="px-4 pt-6">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/clubes" className="text-sm text-muted-600 hover:text-ink-800">
          cancelar
        </Link>
        <h1 className="font-serif text-lg text-ink-900">novo clube</h1>
        <button
          type="submit"
          form="form-criar-clube"
          disabled={!nome.trim() || enviando}
          className="text-sm font-semibold text-brand-600 disabled:text-muted-500/50"
        >
          criar
        </button>
      </div>

      <div className="mb-5 flex items-center justify-center gap-1.5">
        <span className="h-1.5 w-6 rounded-full bg-brand-500" />
        <span className="h-1.5 w-6 rounded-full bg-ink-800/15" />
      </div>

      {erro && <ErrorBanner mensagem={erro} />}

      <form id="form-criar-clube" onSubmit={onSubmit} className="mt-4 flex flex-col gap-5">
        <TextField
          label="nome do clube"
          placeholder="Leitores do Café"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <TextAreaField
          label="descrição"
          placeholder="breve descrição do clube..."
          value={descricao}
          maxLength={LIMITE_DESCRICAO}
          onChange={(e) => setDescricao(e.target.value)}
          counter={{ current: descricao.length, max: LIMITE_DESCRICAO }}
        />

        <div>
          <span className="field-label">privacidade</span>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setPrivacidade("fechado")}
              className={`rounded-xl border p-3 text-left ${
                privacidade === "fechado"
                  ? "border-brand-500 bg-brand-50"
                  : "border-ink-800/10 bg-cream-50"
              }`}
            >
              <span
                className={`mb-2 block h-3 w-3 rounded-full ${
                  privacidade === "fechado" ? "bg-brand-500" : "bg-ink-800/20"
                }`}
              />
              <span className="block text-sm font-semibold text-ink-900">fechado</span>
              <span className="block text-xs text-muted-600">só com convite</span>
            </button>

            <button
              type="button"
              disabled
              title="Clubes públicos ficam para uma próxima versão"
              className="cursor-not-allowed rounded-xl border border-ink-800/10 bg-cream-50 p-3 text-left opacity-50"
            >
              <span className="mb-2 block h-3 w-3 rounded-full bg-ink-800/20" />
              <span className="block text-sm font-semibold text-ink-900">público</span>
              <span className="block text-xs text-muted-600">fora do MVP</span>
            </button>
          </div>
        </div>

        <Button type="submit" loading={enviando} fullWidth className="mt-2">
          próximo →
        </Button>
      </form>
    </div>
  );
}
