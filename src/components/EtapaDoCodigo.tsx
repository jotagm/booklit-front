import { useCallback } from "react";
import VerificacaoPorCodigo from "./VerificacaoPorCodigo";
import { useAuth } from "../auth/AuthContext";
import type { DesafioOtpResponse } from "../api/types";

interface Props {
  email: string;
  senha: string;
  desafio: DesafioOtpResponse;
  onConcluido: () => void;
  onVoltar: () => void;
}

/**
 * Segunda etapa do login e do cadastro: o código enviado por e-mail. "Reenviar" refaz o
 * login com a mesma senha (que fica só na memória desta tela), porque o backend só emite
 * código de login depois de conferir a senha.
 */
export default function EtapaDoCodigo({ email, senha, desafio, onConcluido, onVoltar }: Props) {
  const { entrar, confirmarCodigo } = useAuth();

  const solicitar = useCallback(async () => {
    const resultado = await entrar(email, senha);
    if (resultado.etapa === "concluido") {
      onConcluido();
      return null;
    }
    return resultado.desafio;
  }, [entrar, email, senha, onConcluido]);

  const verificar = useCallback(
    async (desafioId: string, codigo: string) => {
      await confirmarCodigo(desafioId, codigo);
      onConcluido();
    },
    [confirmarCodigo, onConcluido]
  );

  return (
    <>
      <h1 className="font-serif text-2xl text-ink-900">confirme seu e-mail</h1>
      <p className="mt-1 text-sm text-muted-600">falta só o código</p>
      <div className="mt-5">
        <VerificacaoPorCodigo
          email={email}
          desafioInicial={desafio}
          solicitar={solicitar}
          verificar={verificar}
          onCancelar={onVoltar}
        />
      </div>
    </>
  );
}
