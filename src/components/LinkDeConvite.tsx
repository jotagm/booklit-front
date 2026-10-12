import { useEffect, useState } from "react";
import { buscarLinkDeConvite, regenerarLinkDeConvite } from "../api/convites";
import type { ConviteLinkResponse, UUID } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { copiarTexto, linkWhatsApp } from "../utils/compartilhar";
import Modal from "./Modal";
import Button from "./Button";

// Cartão do líder com o link de convite do clube: copiar, mandar no WhatsApp e, se o link
// vazar para fora do grupo, gerar outro (o anterior para de funcionar).
export default function LinkDeConvite({ clubeId, nomeClube }: { clubeId: UUID; nomeClube: string }) {
  const [link, setLink] = useState<ConviteLinkResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [confirmandoNovo, setConfirmandoNovo] = useState(false);
  const [gerando, setGerando] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarLinkDeConvite(clubeId)
      .then((l) => ativo && setLink(l))
      .catch((e) => ativo && setErro(extrairMensagemErro(e, "Não foi possível carregar o link de convite.")));
    return () => {
      ativo = false;
    };
  }, [clubeId]);

  async function copiar() {
    if (!link) return;
    const ok = await copiarTexto(link.url);
    setCopiado(ok);
    if (ok) setTimeout(() => setCopiado(false), 2000);
  }

  async function gerarNovo() {
    setGerando(true);
    try {
      setLink(await regenerarLinkDeConvite(clubeId));
      setConfirmandoNovo(false);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível gerar um novo link."));
    } finally {
      setGerando(false);
    }
  }

  const mensagem = link
    ? `Bora ler junto? Entra no nosso clube "${nomeClube}" no Booklit: ${link.url}`
    : "";

  return (
    <div className="card p-4">
      <p className="text-sm font-semibold text-ink-900">link de convite</p>
      <p className="mt-0.5 text-xs text-muted-600">
        quem abrir o link vê o clube e entra com um clique depois de criar a conta
      </p>

      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}

      {link ? (
        <>
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-ink-800/15 bg-cream-100 px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-xs text-ink-800">{link.url}</span>
            <button
              type="button"
              onClick={copiar}
              className="shrink-0 text-xs font-semibold text-brand-600 hover:underline"
            >
              {copiado ? "copiado!" : "copiar"}
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <a
              href={linkWhatsApp(mensagem)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary px-4 py-2"
            >
              enviar no WhatsApp
            </a>
            <button type="button" onClick={() => setConfirmandoNovo(true)} className="btn-ghost text-xs">
              gerar novo link
            </button>
          </div>
        </>
      ) : (
        !erro && <p className="mt-3 text-xs text-muted-500">carregando link...</p>
      )}

      <Modal aberto={confirmandoNovo} onFechar={() => setConfirmandoNovo(false)} titulo="Gerar novo link">
        <p className="text-sm text-muted-600">
          O link atual vai parar de funcionar. Use isso se ele foi compartilhado com quem não devia.
          Quem já entrou continua no clube.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="secondary" fullWidth onClick={() => setConfirmandoNovo(false)}>
            cancelar
          </Button>
          <Button fullWidth loading={gerando} onClick={gerarNovo}>
            gerar novo
          </Button>
        </div>
      </Modal>
    </div>
  );
}
