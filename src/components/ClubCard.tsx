import { Link } from "react-router-dom";
import type { ClubeDoPainel } from "../hooks/usePainel";
import RoleBadge from "./RoleBadge";
import ProgressBar from "./ProgressBar";
import BookCover from "./BookCover";
import { diasAte, nomeDoDiaSemana, rotuloPrazo, tempoRelativo } from "../utils/date";

// Quantos dias sem atualizar o progresso já contam como "atualize seu progresso".
const DIAS_SEM_REGISTRO = 5;

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

export default function ClubCard({ clube }: { clube: ClubeDoPainel }) {
  const { membro, leituraAtiva, meuRegistro, votacaoAberta, opcoesDaVotacao } = clube;
  const isLider = membro.papel === "LIDER";
  const status = statusDoClube(clube);

  return (
    <Link
      to={`/clubes/${membro.clubeId}`}
      className="card block overflow-hidden transition-shadow hover:shadow-md"
    >
      <div
        className={`flex items-center justify-between px-5 py-3 ${
          isLider ? "bg-brand-500" : "bg-muted-700"
        }`}
      >
        <span className="font-serif text-lg text-cream-50">{membro.nomeClube}</span>
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
