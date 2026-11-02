import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { listarNovidades } from "../api/feed";
import type { UUID } from "../api/types";

/**
 * Clubes com novidade (o ponto na lista de clubes). Recarrega a cada navegação, para o ponto
 * sumir depois de abrir o clube; o clube aberto agora nunca mostra o ponto, mesmo antes de o
 * "visto" chegar ao servidor.
 */
export function useNovidades(): (clubeId: UUID) => boolean {
  const { pathname } = useLocation();
  const [comNovidade, setComNovidade] = useState<Set<UUID>>(new Set());

  useEffect(() => {
    let vivo = true;
    listarNovidades()
      .then((lista) => vivo && setComNovidade(new Set(lista.map((n) => n.clubeId))))
      .catch(() => vivo && setComNovidade(new Set()));
    return () => {
      vivo = false;
    };
  }, [pathname]);

  const aberto = pathname.match(/^\/clubes\/([0-9a-f-]{36})/)?.[1];
  return (clubeId) => clubeId !== aberto && comNovidade.has(clubeId);
}
