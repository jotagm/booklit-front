import { useState } from "react";
import type { FormEvent } from "react";
import { criarComentario } from "../api/comentarios";
import { extrairMensagemErro } from "../api/client";
import type { LeituraClubeResponse, UsuarioResponse } from "../api/types";
import Avatar from "./Avatar";

/**
 * "o que você achou do capítulo de hoje?" (mock 2b): comenta numa das leituras ativas sem sair da
 * home. A pílula escolhe a leitura; com uma só, ela fica fixa.
 */
export default function ComposerDaHome({
  usuario,
  leituras,
  inicial,
  onPublicado,
}: {
  usuario: UsuarioResponse;
  leituras: LeituraClubeResponse[];
  inicial?: LeituraClubeResponse | null;
  onPublicado: () => void;
}) {
  const [leituraId, setLeituraId] = useState(inicial?.id ?? leituras[0]?.id ?? "");
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (leituras.length === 0) return null;
  const escolhida = leituras.find((l) => l.id === leituraId) ?? leituras[0];

  async function publicar(e: FormEvent) {
    e.preventDefault();
    if (!texto.trim()) return;
    setEnviando(true);
    setErro(null);
    try {
      await criarComentario(escolhida.id, { conteudo: texto.trim(), comentarioPaiId: null });
      setTexto("");
      onPublicado();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível publicar o comentário."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={publicar} className="card px-4 py-3">
      <div className="flex items-center gap-2.5">
        <Avatar nome={usuario.nome} usuarioId={usuario.id} fotoUrl={usuario.fotoUrl} size="md" className="!h-9 !w-9 !text-[13px]" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm text-ink-900 outline-none placeholder:text-muted-500"
          placeholder="o que você achou do capítulo de hoje?"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          aria-label="comentário"
        />
        {texto.trim() ? (
          <button type="submit" disabled={enviando} className="btn-primary shrink-0 !px-3.5 !py-1.5 text-[13px]">
            {enviando ? "…" : "publicar"}
          </button>
        ) : null}
        <label className="relative shrink-0">
          <span className="sr-only">leitura</span>
          <select
            value={escolhida.id}
            onChange={(e) => setLeituraId(e.target.value)}
            disabled={leituras.length === 1}
            className="max-w-[180px] appearance-none truncate rounded-full border border-ink-800/15 bg-transparent py-1 pl-3 pr-7 text-[13px] text-muted-700 outline-none disabled:opacity-100"
          >
            {leituras.map((l) => (
              <option key={l.id} value={l.id}>
                {l.livroTitulo}
              </option>
            ))}
          </select>
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-muted-600">▾</span>
        </label>
      </div>
      {erro && <p className="mt-2 text-xs text-red-600">{erro}</p>}
    </form>
  );
}
