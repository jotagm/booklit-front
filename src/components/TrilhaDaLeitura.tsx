import { useState } from "react";
import type { FormEvent } from "react";
import { definirSpotifyDaLeitura } from "../api/leituras";
import type { LeituraClubeResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { analisarLinkSpotify, ROTULO_TIPO_SPOTIFY } from "../utils/spotify";
import SpotifyEmbed from "./SpotifyEmbed";
import Button from "./Button";

// Trilha sonora / audiobook / podcast da leitura no Spotify. Membros só ouvem;
// o líder cola, troca ou remove o link.
export default function TrilhaDaLeitura({
  leitura,
  souLider,
  onAtualizada,
}: {
  leitura: LeituraClubeResponse;
  souLider: boolean;
  onAtualizada: (l: LeituraClubeResponse) => void;
}) {
  const [editando, setEditando] = useState(false);
  const [url, setUrl] = useState(leitura.spotifyUrl ?? "");
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  if (!leitura.spotifyUrl && !souLider) return null;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    const valor = url.trim();
    if (valor && !analisarLinkSpotify(valor)) {
      setErro("Cole um link do Spotify (playlist, álbum, música, podcast ou audiobook).");
      return;
    }
    setSalvando(true);
    setErro(null);
    try {
      onAtualizada(await definirSpotifyDaLeitura(leitura.id, valor || null));
      setEditando(false);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível salvar o link."));
    } finally {
      setSalvando(false);
    }
  }

  const link = analisarLinkSpotify(leitura.spotifyUrl);

  return (
    <section className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-serif text-lg text-ink-900">
          trilha da leitura
          {link && <span className="ml-2 text-xs font-normal text-muted-500">{ROTULO_TIPO_SPOTIFY[link.tipo]}</span>}
        </h2>
        {souLider && !editando && (
          <button
            type="button"
            onClick={() => {
              setUrl(leitura.spotifyUrl ?? "");
              setEditando(true);
            }}
            className="text-sm font-semibold text-brand-600"
          >
            {leitura.spotifyUrl ? "trocar" : "+ adicionar"}
          </button>
        )}
      </div>

      {editando ? (
        <form onSubmit={salvar} className="card flex flex-col gap-3 p-4">
          <p className="text-xs text-muted-600">
            cole o link de uma playlist, álbum, podcast ou audiobook do Spotify (botão compartilhar → copiar link)
          </p>
          <input
            type="url"
            className="field-input"
            placeholder="https://open.spotify.com/playlist/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
          />
          {erro && <p className="text-xs text-red-600">{erro}</p>}
          <div className="flex flex-wrap gap-2">
            <Button type="submit" loading={salvando} className="px-4 py-2">
              salvar
            </Button>
            <Button type="button" variant="secondary" className="px-4 py-2" onClick={() => setEditando(false)}>
              cancelar
            </Button>
            {leitura.spotifyUrl && (
              <button
                type="button"
                disabled={salvando}
                onClick={() => setUrl("")}
                className="ml-auto text-xs font-semibold text-red-600 hover:underline"
              >
                limpar link
              </button>
            )}
          </div>
        </form>
      ) : leitura.spotifyUrl ? (
        <SpotifyEmbed url={leitura.spotifyUrl} titulo={leitura.livroTitulo} />
      ) : (
        <p className="text-sm text-muted-600">
          monte uma playlist para o livro ou indique o audiobook — o player aparece aqui para todo o clube.
        </p>
      )}
    </section>
  );
}
