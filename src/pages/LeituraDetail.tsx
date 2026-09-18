import { useCallback, useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { buscarLeituraPorId } from "../api/leituras";
import { listarRegistrosPorLeitura, atualizarProgresso } from "../api/registros";
import { buscarMembroPorUsuarioEClube } from "../api/membros";
import {
  criarComentario,
  editarComentario,
  deletarComentario,
  listarComentariosPorLeitura,
} from "../api/comentarios";
import type { ComentarioResponse, LeituraClubeResponse, RegistroResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import ProgressBar from "../components/ProgressBar";
import Avatar from "../components/Avatar";
import Button from "../components/Button";
import CommentThread from "../components/CommentThread";
import { formatarData } from "../utils/date";
import { rotuloTipoMeta } from "../utils/format";

export default function LeituraDetail() {
  const { leituraId } = useParams<{ leituraId: string }>();
  const { usuario } = useAuth();

  const [leitura, setLeitura] = useState<LeituraClubeResponse | null>(null);
  const [registros, setRegistros] = useState<RegistroResponse[]>([]);
  const [souLider, setSouLider] = useState(false);
  const [comentarios, setComentarios] = useState<ComentarioResponse[]>([]);
  const [novoValor, setNovoValor] = useState<number>(0);
  const [salvandoProgresso, setSalvandoProgresso] = useState(false);
  const [novoComentario, setNovoComentario] = useState("");
  const [enviandoComentario, setEnviandoComentario] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    if (!leituraId || !usuario) return;
    setErro(null);
    try {
      const leituraResp = await buscarLeituraPorId(leituraId);
      const [registrosResp, meuMembro, comentariosResp] = await Promise.all([
        listarRegistrosPorLeitura(leituraId),
        buscarMembroPorUsuarioEClube(usuario.id, leituraResp.clubeId),
        listarComentariosPorLeitura(leituraId),
      ]);

      setLeitura(leituraResp);
      setRegistros(registrosResp);
      setSouLider(meuMembro?.papel === "LIDER");
      setComentarios(comentariosResp);

      const meuRegistro = registrosResp.find((r) => r.usuarioId === usuario.id);
      setNovoValor(meuRegistro?.valorAtual ?? 0);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar a leitura."));
    } finally {
      setCarregando(false);
    }
  }, [leituraId, usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function salvarProgresso(e: FormEvent) {
    e.preventDefault();
    if (!leituraId) return;
    setSalvandoProgresso(true);
    try {
      const atualizado = await atualizarProgresso(leituraId, novoValor);
      setRegistros((prev) => {
        const semMeu = prev.filter((r) => r.usuarioId !== atualizado.usuarioId);
        return [...semMeu, atualizado].sort((a, b) => a.nomeUsuario.localeCompare(b.nomeUsuario));
      });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível salvar seu progresso."));
    } finally {
      setSalvandoProgresso(false);
    }
  }

  async function enviarComentario(e: FormEvent) {
    e.preventDefault();
    if (!leituraId || !novoComentario.trim()) return;
    setEnviandoComentario(true);
    try {
      await criarComentario(leituraId, { conteudo: novoComentario.trim(), comentarioPaiId: null });
      setNovoComentario("");
      const atualizados = await listarComentariosPorLeitura(leituraId);
      setComentarios(atualizados);
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível publicar o comentário."));
    } finally {
      setEnviandoComentario(false);
    }
  }

  async function responder(paiId: string, conteudo: string) {
    if (!leituraId) return;
    await criarComentario(leituraId, { conteudo, comentarioPaiId: paiId });
    setComentarios(await listarComentariosPorLeitura(leituraId));
  }

  async function editar(id: string, conteudo: string) {
    if (!leituraId) return;
    await editarComentario(id, { conteudo });
    setComentarios(await listarComentariosPorLeitura(leituraId));
  }

  async function excluir(id: string) {
    if (!leituraId) return;
    await deletarComentario(id);
    setComentarios(await listarComentariosPorLeitura(leituraId));
  }

  if (carregando) return <Spinner label="carregando leitura..." />;
  if (erro && !leitura) return <div className="p-4"><ErrorBanner mensagem={erro} /></div>;
  if (!leitura) return null;

  const meuRegistro = registros.find((r) => r.usuarioId === usuario?.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 pb-10 pt-6 lg:px-8 lg:pt-10">
      <Link to={`/clubes/${leitura.clubeId}`} className="text-sm text-muted-600 hover:text-ink-800">
        ← {leitura.nomeClube}
      </Link>

      {erro && (
        <div className="mt-3">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      <div className="card mt-3 flex gap-4 p-4">
        {leitura.livroCapaUrl ? (
          <img src={leitura.livroCapaUrl} alt={leitura.livroTitulo} className="h-28 w-20 shrink-0 rounded object-cover" />
        ) : (
          <div className="flex h-28 w-20 shrink-0 items-center justify-center rounded bg-ink-800/10 text-[10px] text-muted-600">
            capa
          </div>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-xl text-ink-900">{leitura.livroTitulo}</h1>
          <p className="mt-1 text-xs text-muted-600">
            meta: {leitura.valorMeta} {rotuloTipoMeta(leitura.tipoMeta)}
          </p>
          <p className="text-xs text-muted-500">
            {formatarData(leitura.dataInicio)} — {formatarData(leitura.dataFim)}
          </p>
        </div>
      </div>

      {/* meu progresso */}
      <section className="mt-6">
        <h2 className="mb-2 font-serif text-lg text-ink-900">seu progresso</h2>
        <form onSubmit={salvarProgresso} className="card flex items-center gap-3 p-4">
          <input
            type="number"
            min={0}
            max={leitura.valorMeta}
            className="field-input w-24 text-center"
            value={novoValor}
            onChange={(e) => setNovoValor(Number(e.target.value))}
          />
          <span className="text-sm text-muted-600">/ {leitura.valorMeta}</span>
          <div className="flex-1">
            <ProgressBar atual={novoValor} meta={leitura.valorMeta} />
          </div>
          <Button type="submit" loading={salvandoProgresso} className="shrink-0 !px-4 !py-2.5 text-sm">
            salvar
          </Button>
        </form>
        {meuRegistro && (
          <p className="mt-1 text-xs text-muted-500">
            última atualização: {formatarData(meuRegistro.updatedAt)}
          </p>
        )}
      </section>

      {/* progresso do grupo */}
      <section className="mt-6">
        <h2 className="mb-2 font-serif text-lg text-ink-900">progresso do grupo</h2>
        <ul className="card divide-y divide-ink-800/10">
          {registros
            .slice()
            .sort((a, b) => b.valorAtual - a.valorAtual)
            .map((r) => (
              <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                <Avatar nome={r.nomeUsuario} size="sm" />
                <span className="w-28 shrink-0 truncate text-sm text-ink-900">{r.nomeUsuario}</span>
                <div className="flex-1">
                  <ProgressBar atual={r.valorAtual} meta={leitura.valorMeta} tone="muted" />
                </div>
                <span className="w-16 shrink-0 text-right text-xs text-muted-500">
                  {r.valorAtual}/{leitura.valorMeta}
                </span>
              </li>
            ))}
          {registros.length === 0 && (
            <li className="px-4 py-4 text-sm text-muted-600">ainda ninguém registrou progresso.</li>
          )}
        </ul>
      </section>

      {/* discussão */}
      <section className="mt-6">
        <h2 className="mb-2 font-serif text-lg text-ink-900">discussão</h2>

        <form onSubmit={enviarComentario} className="mb-4 flex gap-2">
          <input
            className="field-input"
            placeholder="compartilhe um comentário sobre a leitura..."
            value={novoComentario}
            onChange={(e) => setNovoComentario(e.target.value)}
          />
          <Button type="submit" loading={enviandoComentario} className="shrink-0">
            publicar
          </Button>
        </form>

        {comentarios.length === 0 ? (
          <EmptyState titulo="Nenhum comentário ainda" descricao="Seja o primeiro a comentar sobre esta leitura." />
        ) : (
          <div className="flex flex-col gap-4">
            {comentarios.map((c) => (
              <CommentThread
                key={c.id}
                comentario={c}
                meuUsuarioId={usuario?.id ?? null}
                souLider={souLider}
                onResponder={responder}
                onEditar={editar}
                onExcluir={excluir}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
