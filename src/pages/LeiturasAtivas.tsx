import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listarMembrosPorUsuario } from "../api/membros";
import { buscarLeituraAtiva, listarLeiturasPorClube } from "../api/leituras";
import { buscarRegistroPorLeituraEUsuario } from "../api/registros";
import type { LeituraClubeResponse, RegistroResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { Spinner, ErrorBanner, EmptyState } from "../components/Feedback";
import ProgressBar from "../components/ProgressBar";
import BookCover from "../components/BookCover";
import MiniCalendar from "../components/MiniCalendar";
import { usePainel } from "../hooks/usePainel";
import { formatarDiaMes } from "../utils/date";
import { leituraADefinir, rotuloTipoMeta } from "../utils/format";

interface LeituraDoClube {
  leitura: LeituraClubeResponse;
  meuRegistro: RegistroResponse | null;
}

export default function LeiturasAtivas() {
  const { usuario } = useAuth();
  const [itens, setItens] = useState<LeituraDoClube[] | null>(null);
  // Livros que o clube escolheu na votação e o líder ainda não completou (sem meta e datas).
  const [aDefinir, setADefinir] = useState<{ leitura: LeituraClubeResponse; souLider: boolean }[]>([]);
  const [erro, setErro] = useState<string | null>(null);
  // O calendário saiu da home: os marcos são os mesmos prazos do painel.
  const { painel } = usePainel();

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setErro(null);
    try {
      const membros = await listarMembrosPorUsuario(usuario.id);
      const leituras = await Promise.all(
        membros.map(async (m) => {
          const leitura = await buscarLeituraAtiva(m.clubeId);
          if (!leitura) return null;
          const meuRegistro = await buscarRegistroPorLeituraEUsuario(leitura.id, usuario.id);
          return { leitura, meuRegistro };
        })
      );
      setItens(leituras.filter((l): l is LeituraDoClube => l !== null));
      const pendentes = await Promise.all(
        membros.map(async (m) =>
          (await listarLeiturasPorClube(m.clubeId).catch(() => [] as LeituraClubeResponse[]))
            .filter(leituraADefinir)
            .map((leitura) => ({ leitura, souLider: m.papel === "LIDER" }))
        )
      );
      setADefinir(pendentes.flat());
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar suas leituras."));
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <h1 className="mb-6 font-serif text-[28px] font-bold text-ink-900 lg:text-4xl">leituras ativas</h1>

      {painel && painel.prazos.length > 0 && (
        <div className="mb-6 lg:max-w-sm">
          <MiniCalendar marcos={painel.prazos} />
        </div>
      )}

      {erro && <ErrorBanner mensagem={erro} />}
      {!erro && itens === null && <Spinner label="carregando..." />}

      {aDefinir.length > 0 && (
        <section className="mb-6">
          <h2 className="section-label">a definir</h2>
          <ul className="flex flex-col gap-3">
            {aDefinir.map(({ leitura, souLider }) => (
              <li key={leitura.id} className="card flex items-center gap-4 p-4">
                <BookCover url={leitura.livroCapaUrl} titulo={leitura.livroTitulo} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">{leitura.nomeClube}</p>
                  <p className="truncate font-serif text-lg text-ink-900">{leitura.livroTitulo}</p>
                  <p className="text-xs text-muted-500">
                    escolhido na votação · {souLider ? "defina a meta e as datas para começar" : "o líder vai definir a meta e as datas"}
                  </p>
                </div>
                {souLider && (
                  <Link
                    to={`/clubes/${leitura.clubeId}/leituras/nova?leitura=${leitura.id}`}
                    className="btn-primary shrink-0 !px-3.5 !py-2 text-[13px]"
                  >
                    definir
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {itens !== null && itens.length === 0 && aDefinir.length === 0 && (
        <EmptyState
          titulo="Nenhuma leitura ativa"
          descricao="Quando um dos seus clubes iniciar uma leitura, ela aparece aqui."
        />
      )}

      {itens !== null && itens.length > 0 && (
        <ul className="flex flex-col gap-4">
          {itens.map(({ leitura, meuRegistro }) => (
            <li key={leitura.id}>
              <Link
                to={`/leituras/${leitura.id}`}
                className="card flex items-center gap-4 p-5 transition-shadow hover:shadow-md"
              >
                <BookCover url={leitura.livroCapaUrl} titulo={leitura.livroTitulo} size="lg" />

                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-brand-600">
                    {leitura.nomeClube}
                  </p>
                  <p className="truncate text-lg font-semibold text-ink-900">{leitura.livroTitulo}</p>
                  <p className="text-sm text-muted-500">
                    meta: {leitura.valorMeta} {rotuloTipoMeta(leitura.tipoMeta)} · até{" "}
                    {formatarDiaMes(leitura.dataFim)}
                  </p>

                  {/* No mobile a barra fica embaixo do texto; no desktop, à direita. */}
                  <div className="mt-2 lg:hidden">
                    <ProgressBar atual={meuRegistro?.valorAtual ?? 0} meta={leitura.valorMeta} />
                    <p className="mt-1 text-xs text-muted-500">
                      {meuRegistro?.valorAtual ?? 0} / {leitura.valorMeta}
                    </p>
                  </div>
                </div>

                <div className="hidden w-64 shrink-0 lg:block">
                  <ProgressBar atual={meuRegistro?.valorAtual ?? 0} meta={leitura.valorMeta} />
                  <p className="mt-1.5 text-right text-xs text-muted-500">
                    {meuRegistro?.valorAtual ?? 0} / {leitura.valorMeta}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
