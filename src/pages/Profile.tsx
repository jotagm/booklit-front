import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { listarMembrosPorUsuario } from "../api/membros";
import { listarLeiturasPorClube } from "../api/leituras";
import { buscarRegistroPorLeituraEUsuario } from "../api/registros";
import Avatar from "../components/Avatar";
import { Spinner } from "../components/Feedback";
import { paraDate, sequenciaDeSemanas } from "../utils/date";
import { buscarPerfil } from "../api/usuarios";
import type { PerfilResponse } from "../api/types";
import PerfilCorpo from "../components/PerfilCorpo";

/**
 * Seu perfil como os outros leitores veem: cabeçalho, números numa linha e a estante.
 * Conta, preferências e "sair" ficam em /perfil/configuracoes.
 */
export default function Profile() {
  const { usuario } = useAuth();
  const [semanas, setSemanas] = useState(0);
  const [perfil, setPerfil] = useState<PerfilResponse | null>(null);

  // "semanas" é a sequência de semanas com leitura registrada — derivada das datas
  // dos registros, já que o backend não guarda esse contador.
  const carregarSemanas = useCallback(async () => {
    if (!usuario) return;
    const membros = await listarMembrosPorUsuario(usuario.id);
    const leituras = (await Promise.all(membros.map((m) => listarLeiturasPorClube(m.clubeId).catch(() => [])))).flat();
    const registros = await Promise.all(leituras.map((l) => buscarRegistroPorLeituraEUsuario(l.id, usuario.id)));
    const datas = registros.map((r) => paraDate(r?.updatedAt)).filter((d): d is Date => d !== null);
    setSemanas(sequenciaDeSemanas(datas));
  }, [usuario]);

  useEffect(() => {
    carregarSemanas().catch(() => setSemanas(0));
  }, [carregarSemanas]);

  useEffect(() => {
    if (usuario) buscarPerfil(usuario.id).then(setPerfil).catch(() => setPerfil(null));
  }, [usuario]);

  if (!usuario) return null;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <div className="flex justify-end gap-4 text-sm font-semibold">
        <Link to="/perfil/editar" className="text-brand-600 hover:text-brand-700">
          editar
        </Link>
        <Link to="/perfil/configuracoes" className="text-muted-600 hover:text-ink-800">
          configurações
        </Link>
      </div>

      <div className="mt-3 flex items-center gap-4">
        <Avatar
          nome={usuario.nome}
          usuarioId={usuario.id}
          fotoUrl={usuario.fotoUrl}
          size="lg"
          className="!h-[72px] !w-[72px]"
        />
        <div className="min-w-0">
          <h1 className="font-serif text-2xl font-bold leading-tight text-ink-900">{usuario.nome}</h1>
          {usuario.bio && <p className="mt-1 text-sm text-ink-800">{usuario.bio}</p>}
        </div>
      </div>

      <div className="mt-5">{perfil ? <PerfilCorpo perfil={perfil} semanas={semanas} /> : <Spinner />}</div>
    </div>
  );
}
