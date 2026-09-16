import { useState } from "react";
import type { FormEvent } from "react";
import type { ComentarioResponse } from "../api/types";
import Avatar from "./Avatar";
import Button from "./Button";
import { formatarDataHora } from "../utils/date";

interface Props {
  comentario: ComentarioResponse;
  meuUsuarioId: string;
  souLider: boolean;
  ehResposta?: boolean;
  onResponder: (paiId: string, conteudo: string) => Promise<void>;
  onEditar: (id: string, conteudo: string) => Promise<void>;
  onExcluir: (id: string) => Promise<void>;
}

export default function CommentThread({
  comentario,
  meuUsuarioId,
  souLider,
  ehResposta = false,
  onResponder,
  onEditar,
  onExcluir,
}: Props) {
  const [respondendo, setRespondendo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoResposta, setTextoResposta] = useState("");
  const [textoEdicao, setTextoEdicao] = useState(comentario.conteudo);
  const [enviando, setEnviando] = useState(false);

  const souAutor = comentario.usuarioId === meuUsuarioId;
  const possoExcluir = souAutor || souLider;

  async function enviarResposta(e: FormEvent) {
    e.preventDefault();
    if (!textoResposta.trim()) return;
    setEnviando(true);
    try {
      await onResponder(comentario.id, textoResposta.trim());
      setTextoResposta("");
      setRespondendo(false);
    } finally {
      setEnviando(false);
    }
  }

  async function salvarEdicao(e: FormEvent) {
    e.preventDefault();
    if (!textoEdicao.trim()) return;
    setEnviando(true);
    try {
      await onEditar(comentario.id, textoEdicao.trim());
      setEditando(false);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className={ehResposta ? "ml-9" : ""}>
      <div className="flex gap-3">
        <Avatar nome={comentario.usuarioNome} size="sm" />
        <div className="min-w-0 flex-1">
          <div className="rounded-xl bg-ink-800/[0.04] px-3 py-2">
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-semibold text-ink-900">{comentario.usuarioNome}</span>
              <span className="shrink-0 text-[11px] text-muted-500">
                {formatarDataHora(comentario.createdAt)}
              </span>
            </div>

            {editando ? (
              <form onSubmit={salvarEdicao} className="mt-1.5">
                <textarea
                  className="field-input min-h-[60px] resize-none text-sm"
                  value={textoEdicao}
                  onChange={(e) => setTextoEdicao(e.target.value)}
                  autoFocus
                />
                <div className="mt-1.5 flex gap-2">
                  <Button type="submit" loading={enviando} className="!px-3 !py-1.5 text-xs">
                    salvar
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    className="!px-3 !py-1.5 text-xs"
                    onClick={() => setEditando(false)}
                  >
                    cancelar
                  </Button>
                </div>
              </form>
            ) : (
              <p className={`mt-0.5 text-sm ${comentario.removido ? "italic text-muted-500" : "text-ink-800"}`}>
                {comentario.conteudo}
              </p>
            )}
          </div>

          {!comentario.removido && !editando && (
            <div className="mt-1 flex gap-3 pl-3 text-xs font-semibold text-muted-500">
              {!ehResposta && (
                <button onClick={() => setRespondendo((v) => !v)} className="hover:text-brand-600">
                  responder
                </button>
              )}
              {souAutor && (
                <button onClick={() => setEditando(true)} className="hover:text-brand-600">
                  editar
                </button>
              )}
              {possoExcluir && (
                <button onClick={() => onExcluir(comentario.id)} className="hover:text-red-600">
                  excluir
                </button>
              )}
            </div>
          )}

          {respondendo && (
            <form onSubmit={enviarResposta} className="mt-2 flex gap-2">
              <input
                className="field-input text-sm"
                placeholder="escrever uma resposta..."
                value={textoResposta}
                onChange={(e) => setTextoResposta(e.target.value)}
                autoFocus
              />
              <Button type="submit" loading={enviando} className="!px-3 !py-2 text-xs shrink-0">
                enviar
              </Button>
            </form>
          )}

          {comentario.respostas.length > 0 && (
            <div className="mt-2 flex flex-col gap-2">
              {comentario.respostas.map((resposta) => (
                <CommentThread
                  key={resposta.id}
                  comentario={resposta}
                  meuUsuarioId={meuUsuarioId}
                  souLider={souLider}
                  ehResposta
                  onResponder={onResponder}
                  onEditar={onEditar}
                  onExcluir={onExcluir}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
