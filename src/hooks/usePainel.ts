import { useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import { listarMembrosPorClube, listarMembrosPorUsuario } from "../api/membros";
import { buscarLeituraAtiva } from "../api/leituras";
import { listarRegistrosPorLeitura } from "../api/registros";
import { listarComentariosPorLeitura } from "../api/comentarios";
import { listarVotacoesPorClube } from "../api/votacoes";
import { listarOpcoesPorVotacao } from "../api/opcoesVoto";
import { extrairMensagemErro } from "../api/client";
import type {
  ComentarioResponse,
  LeituraClubeResponse,
  RegistroResponse,
  UsuarioClubeResponse,
  UsuarioId,
  UUID,
  VotacaoResponse,
} from "../api/types";
import { diasAte, nomeDoDiaSemana, paraDate, sequenciaDeSemanas } from "../utils/date";

// O backend não tem endpoints de feed, de sequência de leitura nem de prazos:
// tudo aqui é derivado no cliente a partir de membros/leituras/registros/
// comentários/votações, que são os recursos que a API expõe hoje.

export interface ClubeDoPainel {
  membro: UsuarioClubeResponse;
  leituraAtiva: LeituraClubeResponse | null;
  meuRegistro: RegistroResponse | null;
  membrosDoClube: UsuarioClubeResponse[];
  votacaoAberta: VotacaoResponse | null;
  opcoesDaVotacao: number;
}

export type TipoEvento = "terminou" | "progresso" | "comentou" | "votacao" | "sugestao" | "entrou";

export interface Evento {
  id: string;
  tipo: TipoEvento;
  titulo: string;
  autor: string | null;
  nomeClube: string;
  data: string;
  para: string;
}

export interface Prazo {
  id: string;
  titulo: string;
  subtitulo: string;
  data: string;
  dias: number | null;
  para: string;
}

export interface Painel {
  clubes: ClubeDoPainel[];
  eventos: Evento[];
  prazos: Prazo[];
  continuarLeitura: { leitura: LeituraClubeResponse; registro: RegistroResponse | null } | null;
  semanasDeSequencia: number;
}

function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? nome;
}

function achatarComentarios(arvore: ComentarioResponse[]): ComentarioResponse[] {
  return arvore.flatMap((c) => [c, ...achatarComentarios(c.respostas ?? [])]);
}

function maisRecentePrimeiro(a: { data: string }, b: { data: string }): number {
  return (paraDate(b.data)?.getTime() ?? 0) - (paraDate(a.data)?.getTime() ?? 0);
}

async function carregarClube(
  membro: UsuarioClubeResponse,
  usuarioId: UsuarioId
): Promise<{ clube: ClubeDoPainel; eventos: Evento[] }> {
  const [leituraAtiva, membrosDoClube, votacoes] = await Promise.all([
    buscarLeituraAtiva(membro.clubeId),
    listarMembrosPorClube(membro.clubeId).catch(() => [] as UsuarioClubeResponse[]),
    listarVotacoesPorClube(membro.clubeId).catch(() => [] as VotacaoResponse[]),
  ]);

  const votacaoAberta = votacoes.find((v) => v.status === "ABERTA") ?? null;

  const [registros, comentarios, opcoes] = await Promise.all([
    leituraAtiva
      ? listarRegistrosPorLeitura(leituraAtiva.id).catch(() => [] as RegistroResponse[])
      : Promise.resolve([] as RegistroResponse[]),
    leituraAtiva
      ? listarComentariosPorLeitura(leituraAtiva.id).catch(() => [] as ComentarioResponse[])
      : Promise.resolve([] as ComentarioResponse[]),
    votacaoAberta ? listarOpcoesPorVotacao(votacaoAberta.id).catch(() => []) : Promise.resolve([]),
  ]);

  const meuRegistro = registros.find((r) => r.usuarioId === usuarioId) ?? null;
  const eventos: Evento[] = [];

  if (leituraAtiva) {
    const rotaLeitura = `/leituras/${leituraAtiva.id}`;

    for (const r of registros) {
      if (r.usuarioId === usuarioId) continue;
      const terminou = r.valorAtual >= leituraAtiva.valorMeta;
      eventos.push({
        id: `registro-${r.id}`,
        tipo: terminou ? "terminou" : "progresso",
        titulo: terminou
          ? `${primeiroNome(r.nomeUsuario)} terminou ${leituraAtiva.livroTitulo}`
          : `${primeiroNome(r.nomeUsuario)} atualizou o progresso em ${leituraAtiva.livroTitulo}`,
        autor: r.nomeUsuario,
        nomeClube: membro.nomeClube,
        data: r.updatedAt,
        para: rotaLeitura,
      });
    }

    for (const c of achatarComentarios(comentarios)) {
      if (c.usuarioId === usuarioId || c.removido) continue;
      eventos.push({
        id: `comentario-${c.id}`,
        tipo: "comentou",
        titulo: `${primeiroNome(c.usuarioNome)} comentou em ${leituraAtiva.livroTitulo}`,
        autor: c.usuarioNome,
        nomeClube: membro.nomeClube,
        data: c.createdAt,
        para: rotaLeitura,
      });
    }
  }

  if (votacaoAberta) {
    const rotaVotacao = `/votacoes/${votacaoAberta.id}`;
    eventos.push({
      id: `votacao-${votacaoAberta.id}`,
      tipo: "votacao",
      titulo: `votação aberta — vote até ${nomeDoDiaSemana(votacaoAberta.dataEncerramento)}`,
      autor: null,
      nomeClube: membro.nomeClube,
      data: votacaoAberta.dataAbertura,
      para: rotaVotacao,
    });

    for (const o of opcoes) {
      if (o.sugeridoPorId === usuarioId) continue;
      eventos.push({
        id: `opcao-${o.id}`,
        tipo: "sugestao",
        titulo: `${primeiroNome(o.nomeSugeridoPor)} sugeriu um livro na votação de ${membro.nomeClube}`,
        autor: o.nomeSugeridoPor,
        nomeClube: membro.nomeClube,
        // OpcaoVotoResponse não traz data própria: a abertura da votação é o melhor
        // carimbo disponível para ordenar a sugestão no feed.
        data: votacaoAberta.dataAbertura,
        para: rotaVotacao,
      });
    }
  }

  for (const m of membrosDoClube) {
    if (m.usuarioId === usuarioId) continue;
    const dias = diasAte(m.entrouEm);
    if (dias === null || dias < -14) continue;
    eventos.push({
      id: `membro-${m.id}`,
      tipo: "entrou",
      titulo: `${primeiroNome(m.nomeUsuario)} entrou no clube`,
      autor: m.nomeUsuario,
      nomeClube: membro.nomeClube,
      data: m.entrouEm,
      para: `/clubes/${membro.clubeId}`,
    });
  }

  return {
    clube: { membro, leituraAtiva, meuRegistro, membrosDoClube, votacaoAberta, opcoesDaVotacao: opcoes.length },
    eventos,
  };
}

export function usePainel() {
  const { usuario } = useAuth();
  const [painel, setPainel] = useState<Painel | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (!usuario) return;
    setErro(null);
    try {
      const filiacoes = await listarMembrosPorUsuario(usuario.id);
      const carregados = await Promise.all(filiacoes.map((m) => carregarClube(m, usuario.id)));

      const clubes = carregados.map((c) => c.clube);
      const eventos = carregados.flatMap((c) => c.eventos).sort(maisRecentePrimeiro);

      const prazos: Prazo[] = [];
      for (const c of clubes) {
        if (c.votacaoAberta) {
          prazos.push({
            id: `prazo-votacao-${c.votacaoAberta.id}`,
            titulo: "votação do próximo livro",
            subtitulo: c.membro.nomeClube,
            data: c.votacaoAberta.dataEncerramento,
            dias: diasAte(c.votacaoAberta.dataEncerramento),
            para: `/votacoes/${c.votacaoAberta.id}`,
          });
        }
        if (c.leituraAtiva) {
          prazos.push({
            id: `prazo-leitura-${c.leituraAtiva.id}`,
            titulo: c.leituraAtiva.livroTitulo,
            subtitulo: c.membro.nomeClube,
            data: c.leituraAtiva.dataFim,
            dias: diasAte(c.leituraAtiva.dataFim),
            para: `/leituras/${c.leituraAtiva.id}`,
          });
        }
      }
      prazos.sort((a, b) => (a.dias ?? 9999) - (b.dias ?? 9999));

      // "continuar leitura": a leitura ativa em que o usuário já começou e ainda
      // não terminou; se não houver nenhuma começada, a primeira leitura ativa.
      const comLeitura = clubes.filter((c) => c.leituraAtiva !== null);
      const emAndamento = comLeitura.find(
        (c) => (c.meuRegistro?.valorAtual ?? 0) > 0 && (c.meuRegistro?.valorAtual ?? 0) < c.leituraAtiva!.valorMeta
      );
      const escolhida = emAndamento ?? comLeitura[0] ?? null;

      const datasDeLeitura = clubes
        .map((c) => paraDate(c.meuRegistro?.updatedAt))
        .filter((d): d is Date => d !== null);

      setPainel({
        clubes,
        eventos,
        prazos: prazos.filter((p) => (p.dias ?? -1) >= 0).slice(0, 5),
        continuarLeitura: escolhida
          ? { leitura: escolhida.leituraAtiva!, registro: escolhida.meuRegistro }
          : null,
        semanasDeSequencia: sequenciaDeSemanas(datasDeLeitura),
      });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível carregar seus clubes."));
    }
  }, [usuario]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  return { painel, erro, recarregar: carregar };
}
