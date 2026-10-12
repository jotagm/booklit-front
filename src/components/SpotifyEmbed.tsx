import { alturaEmbedSpotify, urlEmbedSpotify } from "../utils/spotify";

// Player oficial do Spotify via iframe. Não usa a Web API: desde 2026 apps em Development
// Mode ficam limitados a 5 usuários, e o embed funciona para qualquer visitante.
export default function SpotifyEmbed({ url, titulo }: { url: string; titulo: string }) {
  const src = urlEmbedSpotify(url);
  if (!src) return null;

  return (
    <iframe
      title={`Spotify — ${titulo}`}
      src={src}
      width="100%"
      height={alturaEmbedSpotify(url)}
      loading="lazy"
      allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
      className="block w-full rounded-xl border-0"
    />
  );
}
