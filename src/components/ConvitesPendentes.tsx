import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { aceitarConvite, listarMeusConvites, recusarConvite } from "../api/convites";
import type { ConviteResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import Button from "./Button";
import { formatarData } from "../utils/date";

// Convites por e-mail endereçados ao usuário. Sem isso o convite existia no banco mas
// ninguém conseguia vê-lo nem aceitá-lo.
export default function ConvitesPendentes() {
  const navigate = useNavigate();
  const [convites, setConvites] = useState<ConviteResponse[]>([]);
  const [processando, setProcessando] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    listarMeusConvites()
      .then((c) => ativo && setConvites(c))
      .catch(() => {
        // Falhar aqui não pode derrubar o painel; o resto da tela segue normal.
      });
    return () => {
      ativo = false;
    };
  }, []);

  async function aceitar(c: ConviteResponse) {
    setProcessando(c.id);
    setErro(null);
    try {
      await aceitarConvite(c.id);
      navigate(`/clubes/${c.clubeId}`);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível aceitar o convite."));
      setProcessando(null);
    }
  }

  async function recusar(c: ConviteResponse) {
    setProcessando(c.id);
    setErro(null);
    try {
      await recusarConvite(c.id);
      setConvites((prev) => prev.filter((x) => x.id !== c.id));
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível recusar o convite."));
    } finally {
      setProcessando(null);
    }
  }

  if (convites.length === 0) return null;

  return (
    <section className="mb-7">
      <h2 className="section-label">convites para você</h2>
      {erro && <p className="mb-2 text-xs text-red-600">{erro}</p>}
      <ul className="flex flex-col gap-3">
        {convites.map((c) => (
          <li key={c.id} className="card flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
            <div className="min-w-0 flex-1">
              <p className="font-serif text-lg leading-tight text-ink-900">{c.nomeClube}</p>
              <p className="mt-0.5 text-xs text-muted-600">
                convite de {c.nomeConvidadoPor} · expira em {formatarData(c.expiraEm)}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                className="px-4 py-2"
                disabled={processando !== null}
                onClick={() => recusar(c)}
              >
                recusar
              </Button>
              <Button className="px-4 py-2" loading={processando === c.id} onClick={() => aceitar(c)}>
                entrar no clube
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
