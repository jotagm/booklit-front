import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { buscarPerfil } from "../api/usuarios";
import { extrairMensagemErro } from "../api/client";
import type { PerfilResponse } from "../api/types";
import Avatar from "../components/Avatar";
import PerfilCorpo, { membroDesde } from "../components/PerfilCorpo";
import { ErrorBanner, Spinner } from "../components/Feedback";

/** Perfil de outro leitor — só abre para quem divide clube com ele (o backend responde 404 nos demais). */
export default function LeitorPerfil() {
  const { id } = useParams();
  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    setPerfil(null);
    setErro(null);
    const numero = Number(id);
    if (!Number.isInteger(numero)) {
      setErro("Leitor não encontrado.");
      return;
    }
    buscarPerfil(numero)
      .then(setPerfil)
      .catch((e) => setErro(extrairMensagemErro(e, "Não foi possível abrir este perfil.")));
  }, [id]);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <Link to="/clubes" className="text-sm text-muted-600 hover:text-ink-800">
        ← voltar
      </Link>
      {erro && (
        <div className="mt-4">
          <ErrorBanner mensagem={erro} />
        </div>
      )}
      {!perfil && !erro && <Spinner />}
      {perfil && (
        <>
          <div className="mb-6 mt-4 flex flex-col items-center text-center">
            <Avatar nome={perfil.nome} usuarioId={perfil.id} size="lg" />
            <h1 className="mt-4 font-serif text-2xl font-bold text-ink-900">{perfil.nome}</h1>
            {perfil.bio && <p className="mt-2 max-w-md text-sm text-ink-800">{perfil.bio}</p>}
            {membroDesde(perfil.membroDesde) && (
              <p className="mt-1.5 text-xs text-muted-500">{membroDesde(perfil.membroDesde)}</p>
            )}
          </div>
          <PerfilCorpo perfil={perfil} />
        </>
      )}
    </div>
  );
}
