import { useCallback } from "react";
import VerificacaoPorCodigo from "./VerificacaoPorCodigo";
import { useAuth } from "../auth/AuthContext";
import { solicitarCodigo } from "../api/otp";

interface Props {
  email: string;
  onConcluido: () => void;
  onVoltar: () => void;
}

/**
 * Última etapa do cadastro: o código que o backend manda para o e-mail da conta nova. Código
 * certo abre a sessão (o token vem junto na verificação); código errado mostra o aviso do
 * backend. O código é pedido ao abrir a tela, e "reenviar" respeita o Retry-After.
 * É diferente de EtapaDoCodigo, que é a segunda etapa do login.
 */
export default function EtapaDoCadastro({ email, onConcluido, onVoltar }: Props) {
  const { confirmarCadastro } = useAuth();

  const solicitar = useCallback(() => solicitarCodigo(email, "VERIFICAR_EMAIL"), [email]);

  const verificar = useCallback(
    async (desafioId: string, codigo: string) => {
      await confirmarCadastro(desafioId, codigo);
      onConcluido();
    },
    [confirmarCadastro, onConcluido]
  );

  return (
    <>
      <h1 className="font-serif text-2xl text-ink-900">confirme seu e-mail</h1>
      <p className="mt-1 text-sm text-muted-600">falta só o código</p>
      <div className="mt-5">
        <VerificacaoPorCodigo email={email} solicitar={solicitar} verificar={verificar} onCancelar={onVoltar} />
      </div>
    </>
  );
}
