import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { buscarPreviaDoConvite, entrarPorLink } from "../api/convites";
import type { ConvitePreviewResponse } from "../api/types";
import { extrairMensagemErro } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import Button from "../components/Button";
import BookCover from "../components/BookCover";
import { ErrorBanner, Spinner } from "../components/Feedback";
import { Logo } from "../components/NavIcons";

// Página pública do link de convite (booklit.bio/convite/<codigo>). É a primeira coisa que
// o convidado vê, então precisa convencer antes de pedir conta: clube, líder, quantos
// membros e o livro que estão lendo agora.
export default function ConvitePublico() {
  const { codigo = "" } = useParams<{ codigo: string }>();
  const { usuario } = useAuth();
  const navigate = useNavigate();

  const [previa, setPrevia] = useState<ConvitePreviewResponse | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    let ativo = true;
    buscarPreviaDoConvite(codigo)
      .then((p) => ativo && setPrevia(p))
      .catch((e) =>
        ativo && setErro(extrairMensagemErro(e, "Este link de convite não existe ou foi trocado pelo líder."))
      )
      .finally(() => ativo && setCarregando(false));
    return () => {
      ativo = false;
    };
  }, [codigo]);

  async function entrar() {
    setEntrando(true);
    setErro(null);
    try {
      const clube = await entrarPorLink(codigo);
      navigate(`/clubes/${clube.id}`, { replace: true });
    } catch (e) {
      setErro(extrairMensagemErro(e, "Não foi possível entrar no clube."));
      setEntrando(false);
    }
  }

  // Volta para esta mesma página depois do login/cadastro, aí é só um clique.
  const voltarAqui = { from: { pathname: `/convite/${codigo}` } };

  return (
    <div className="flex min-h-screen w-full justify-center bg-cream-100 px-6 py-10">
      <div className="flex w-full max-w-sm flex-col">
        <Link to="/" className="mb-8 self-center">
          <Logo />
        </Link>

        {carregando && <Spinner label="abrindo convite..." />}

        {!carregando && !previa && (
          <div className="flex flex-col gap-4">
            <ErrorBanner mensagem={erro ?? "Convite inválido."} />
            <Link to={usuario ? "/clubes" : "/"} className="text-center text-sm font-semibold text-brand-600">
              ir para o início
            </Link>
          </div>
        )}

        {previa && (
          <>
            <p className="text-center text-xs font-bold uppercase tracking-[0.12em] text-muted-500">
              você foi convidado para
            </p>
            <h1 className="mt-2 text-center font-serif text-3xl text-ink-900">{previa.nomeClube}</h1>
            {previa.descricao && (
              <p className="mt-2 text-center text-sm text-muted-600">{previa.descricao}</p>
            )}

            <p className="mt-3 text-center text-xs text-muted-500">
              {previa.nomeLider ? `liderado por ${previa.nomeLider} · ` : ""}
              {previa.totalMembros} {previa.totalMembros === 1 ? "membro" : "membros"}
            </p>

            {previa.temas.length > 0 && (
              <div className="mt-3 flex flex-wrap justify-center gap-1.5">
                {previa.temas.map((t) => (
                  <span key={t} className="chip-neutro">
                    {t}
                  </span>
                ))}
              </div>
            )}

            {previa.leituraAtual && (
              <div className="card mt-6 flex items-center gap-3 p-4">
                <BookCover url={previa.leituraAtual.livroCapaUrl} titulo={previa.leituraAtual.livroTitulo} />
                <div className="min-w-0">
                  <p className="section-label mb-0.5">lendo agora</p>
                  <p className="font-serif text-lg leading-tight text-ink-900">{previa.leituraAtual.livroTitulo}</p>
                </div>
              </div>
            )}

            {erro && (
              <div className="mt-4">
                <ErrorBanner mensagem={erro} />
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              {usuario ? (
                <Button fullWidth loading={entrando} onClick={entrar}>
                  entrar no clube
                </Button>
              ) : (
                <>
                  <Link to="/cadastro" state={voltarAqui}>
                    <Button fullWidth>criar conta e entrar</Button>
                  </Link>
                  <Link to="/entrar" state={voltarAqui}>
                    <Button variant="secondary" fullWidth>
                      já tenho conta
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
