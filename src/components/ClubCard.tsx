import { Link } from "react-router-dom";
import type { ClubeDoPainel } from "../hooks/usePainel";
import RoleBadge from "./RoleBadge";
import ProgressBar from "./ProgressBar";
import BookCover from "./BookCover";
import { corPorId } from "../utils/cores";
import { DIAS_SEM_REGISTRO, diasAte, nomeDoDiaSemana, rotuloPrazo, tempoRelativo } from "../utils/date";

function statusDoClube(clube: ClubeDoPainel) {
  if (clube.votacaoAberta) {
    return {
      classe: "chip-forte",
      texto: `🗳 vote até ${nomeDoDiaSemana(clube.votacaoAberta.dataEncerramento)}`,
    };
  }

  if (clube.leituraAtiva) {
    const diasSemRegistro = clube.meuRegistro ? -(diasAte(clube.meuRegistro.updatedAt) ?? 0) : null;
    if (diasSemRegistro === null || diasSemRegistro >= DIAS_SEM_REGISTRO) {
      return { classe: "chip-suave", texto: "atualize seu progresso" };
    }
    return {
      classe: "chip-neutro",
      texto: `✓ no ritmo · ${rotuloPrazo(diasAte(clube.leituraAtiva.dataFim))} restantes`,
    };
  }

  return null;
}

export default function ClubCard({ clube, novidade = false }: { clube: ClubeDoPainel; novidade?: boolean }) {
  const { membro, leituraAtiva, meuRegistro, votacaoAberta, opcoesDaVotacao } = clube;
  const status = statusDoClube(clube);

  return (
    <Link
      to={`/clubes/${membro.clubeId}`}
      className="card block overflow-hidden transition-shadow hover:shadow-md"
    >
      <div
        className="flex items-center justify-between px-5 py-3"
        style={{ backgroundColor: corPorId(membro.clubeId) }}
      >
        <span className="flex min-w-0 items-center gap-2 font-serif text-lg text-cream-50">
          <span className="truncate">{membro.nomeClube}</span>
          {novidade && (
            <span className="h-2 w-2 shrink-0 rounded-full bg-cream-50" aria-label="tem novidade" title="atividade nova" />
          )}
        </span>
        <RoleBadge papel={membro.papel} />
      </div>

      <div className="p-5">
        {status && <span className={`${status.classe} mb-4`}>{status.texto}</span>}

        {leituraAtiva ? (
          <>
            <div className="flex gap-4">
              <BookCover url={leituraAtiva.livroCapaUrl} titulo={leituraAtiva.livroTitulo} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold text-ink-900">
                  {leituraAtiva.livroTitulo}
                </p>
                <p className="text-sm text-muted-500">
                  progresso {meuRegistro?.valorAtual ?? 0} / {leituraAtiva.valorMeta}
                </p>
                <div className="mt-2">
                  <ProgressBar atual={meuRegistro?.valorAtual ?? 0} meta={leituraAtiva.valorMeta} />
                </div>
                {meuRegistro && (
                  <p className="mt-1.5 text-[11px] text-muted-400">
                    atualizado {tempoRelativo(meuRegistro.updatedAt)}
                  </p>
                )}
              </div>
            </div>
          </>
        ) : votacaoAberta ? (
          <p className="text-sm text-muted-600">
            votação do próximo livro aberta · {opcoesDaVotacao}{" "}
            {opcoesDaVotacao === 1 ? "opção sugerida" : "opções sugeridas"}
          </p>
        ) : (
          <p className="text-sm text-muted-600">nenhuma leitura ativa no momento</p>
        )}
      </div>
    </Link>
  );
}
