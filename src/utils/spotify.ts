// O backend guarda o link canônico (https://open.spotify.com/<tipo>/<id>). O player
// embutido é o mesmo caminho sob /embed — sem Web API, sem login, funciona pra qualquer um.
const FORMATO =
  /^https?:\/\/open\.spotify\.com\/(?:intl-[a-zA-Z-]+\/)?(playlist|album|track|episode|show|audiobook)\/([A-Za-z0-9]{10,40})/;

export type TipoSpotify = "playlist" | "album" | "track" | "episode" | "show" | "audiobook";

export function analisarLinkSpotify(url: string | null | undefined): { tipo: TipoSpotify; id: string } | null {
  if (!url) return null;
  const m = url.trim().match(FORMATO);
  if (!m) return null;
  return { tipo: m[1] as TipoSpotify, id: m[2] };
}

export function urlEmbedSpotify(url: string | null | undefined): string | null {
  const link = analisarLinkSpotify(url);
  if (!link) return null;
  return `https://open.spotify.com/embed/${link.tipo}/${link.id}?utm_source=booklit`;
}

// Música e episódio cabem no player compacto; listas precisam de altura para mostrar faixas.
export function alturaEmbedSpotify(url: string | null | undefined): number {
  const link = analisarLinkSpotify(url);
  return link && (link.tipo === "track" || link.tipo === "episode") ? 152 : 352;
}

export const ROTULO_TIPO_SPOTIFY: Record<TipoSpotify, string> = {
  playlist: "playlist",
  album: "álbum",
  track: "música",
  episode: "episódio",
  show: "podcast",
  audiobook: "audiobook",
};
