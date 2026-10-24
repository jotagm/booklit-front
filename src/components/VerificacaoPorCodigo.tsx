import { useCallback, useEffect, useRef, useState } from "react";
import type { FormEvent } from "react";
import Button from "./Button";
import { TextField } from "./TextField";
import { ErrorBanner } from "./Feedback";
import { extrairMensagemErro } from "../api/client";
import { segundosParaReenviar, solicitarCodigo, verificarCodigo } from "../api/otp";
import type { DesafioOtpResponse, FinalidadeOtp } from "../api/types";

const INTERVALO_REENVIO_PADRAO = 60;

interface Props {
  email: string;
  /**
   * Pede (ou reenvia) o código. Devolve null quando não há mais código a pedir (ex.: o
   * backend desligou a etapa e o login já concluiu).
   */
  solicitar: () => Promise<DesafioOtpResponse | null>;
  /** Confere o código; resolve quando deu certo, rejeita com a mensagem do backend. */
  verificar: (desafioId: string, codigo: string) => Promise<void>;
  /** Desafio já emitido por quem abriu a tela (ex.: o POST /auth/login): não pede de novo ao montar. */
  desafioInicial?: DesafioOtpResponse;
  onCancelar?: () => void;
}

/**
 * Bloco de "digite o código que enviamos por e-mail": confere, e controla o "reenviar"
 * pelo Retry-After do backend. Quem usa decide de onde vem o código (login, verificação
 * de e-mail...) pelas funções `solicitar` e `verificar`.
 */
export default function VerificacaoPorCodigo({ email, solicitar, verificar, desafioInicial, onCancelar }: Props) {
  const [desafioId, setDesafioId] = useState<string | null>(desafioInicial?.desafioId ?? null);
  const [codigo, setCodigo] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [segundosParaNovoEnvio, setSegundosParaNovoEnvio] = useState(desafioInicial ? INTERVALO_REENVIO_PADRAO : 0);
  const jaPediu = useRef(!!desafioInicial);

  useEffect(() => {
    if (segundosParaNovoEnvio <= 0) return;
    const timer = window.setTimeout(() => setSegundosParaNovoEnvio((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [segundosParaNovoEnvio]);

  const enviar = useCallback(async () => {
    setErro(null);
    setEnviando(true);
    try {
      const desafio = await solicitar();
      if (!desafio) return;
      setDesafioId(desafio.desafioId);
      setCodigo("");
      setSegundosParaNovoEnvio(INTERVALO_REENVIO_PADRAO);
    } catch (err) {
      const espera = segundosParaReenviar(err);
      if (espera !== null) setSegundosParaNovoEnvio(espera);
      setErro(extrairMensagemErro(err, "Não foi possível enviar o código."));
    } finally {
      setEnviando(false);
    }
  }, [solicitar]);

  // O ref evita o pedido duplo do StrictMode em dev, que esbarraria no limite de 60 s.
  useEffect(() => {
    if (jaPediu.current) return;
    jaPediu.current = true;
    void enviar();
  }, [enviar]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!desafioId) return;
    setErro(null);
    setVerificando(true);
    try {
      await verificar(desafioId, codigo);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Código inválido."));
    } finally {
      setVerificando(false);
    }
  }

  const digitos = codigo.replace(/\D/g, "");

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <p className="text-sm text-muted-600">
        Enviamos um código de 6 dígitos para <span className="font-semibold text-ink-900">{email}</span>.
        Ele vale por 10 minutos.
      </p>

      {erro && <ErrorBanner mensagem={erro} />}

      <TextField
        label="código"
        inputMode="numeric"
        autoComplete="one-time-code"
        placeholder="000000"
        maxLength={7}
        autoFocus
        value={codigo}
        onChange={(e) => setCodigo(e.target.value.replace(/[^\d ]/g, ""))}
        className="[&_input]:text-center [&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[0.4em]"
        required
      />

      <Button type="submit" loading={verificando} disabled={!desafioId || digitos.length !== 6} fullWidth>
        confirmar
      </Button>

      <div className="flex items-center justify-between text-sm">
        <Button
          type="button"
          variant="ghost"
          onClick={() => void enviar()}
          loading={enviando}
          disabled={segundosParaNovoEnvio > 0}
        >
          {segundosParaNovoEnvio > 0 ? `reenviar em ${segundosParaNovoEnvio}s` : "reenviar código"}
        </Button>
        {onCancelar && (
          <Button type="button" variant="ghost" onClick={onCancelar}>
            voltar
          </Button>
        )}
      </div>
    </form>
  );
}

/** Atalho para o endpoint público de OTP (verificar e-mail, redefinir PIN...). */
export function codigoPorEmail(email: string, finalidade: Exclude<FinalidadeOtp, "LOGIN">) {
  return {
    solicitar: () => solicitarCodigo(email, finalidade),
    verificar: async (desafioId: string, codigo: string) => {
      await verificarCodigo(desafioId, finalidade, codigo);
    },
  };
}
