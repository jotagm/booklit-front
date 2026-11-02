import { useEffect, useState } from "react";
import { corPorId } from "../utils/cores";

function iniciais(nome: string): string {
  const partes = nome.trim().split(/\s+/);
  const primeira = partes[0]?.[0] ?? "";
  const ultima = partes.length > 1 ? partes[partes.length - 1][0] : "";
  return (primeira + ultima).toUpperCase();
}

const tamanhos = {
  sm: "h-7 w-7 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-20 w-20 text-2xl",
} as const;


export default function Avatar({
  nome,
  usuarioId,
  size = "md",
  className = "",
  fotoUrl,
}: {
  nome: string;
  usuarioId?: number;
  size?: keyof typeof tamanhos;
  className?: string;
  /** Foto de perfil; sem ela (ou se a URL falhar, por exemplo vencida) aparecem as iniciais. */
  fotoUrl?: string | null;
}) {
  const [falhou, setFalhou] = useState(false);
  // Uma URL nova (troca de foto) merece outra tentativa, mesmo depois de uma falha.
  useEffect(() => setFalhou(false), [fotoUrl]);

  const classes = `flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500 font-semibold text-cream-50 ${tamanhos[size]} ${className}`;

  if (fotoUrl && !falhou) {
    return (
      <img
        src={fotoUrl}
        alt={nome}
        title={nome}
        className={`${classes} object-cover`}
        onError={() => setFalhou(true)}
      />
    );
  }

  return (
    <div
      className={classes}
      style={usuarioId === undefined ? undefined : { backgroundColor: corPorId(usuarioId) }}
      title={nome}
    >
      {iniciais(nome) || "?"}
    </div>
  );
}
