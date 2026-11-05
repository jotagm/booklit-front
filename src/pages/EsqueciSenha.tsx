import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";
import { useAuth } from "../auth/AuthContext";
import { extrairMensagemErro } from "../api/client";
import { esqueciSenha } from "../api/auth";
import { segundosParaReenviar } from "../api/otp";
import type { DesafioOtpResponse } from "../api/types";

const INTERVALO_REENVIO = 60;
/** Mesmo limite do backend (RedefinirSenhaRequest): 8 a 72 caracteres. */
const SENHA_MINIMA = 8;
const SENHA_MAXIMA = 72;

function mensagemDeEspera(segundos: number): string {
  return segundos >= 120
    ? `Muitos pedidos de código. Tente de novo em ${Math.ceil(segundos / 60)} min.`
    : `Aguarde ${segundos}s para pedir outro código.`;
}

/**
 * "Esqueci minha senha", em duas etapas na mesma tela:
 * 1. o e-mail, que recebe um código de 6 dígitos (a resposta é a mesma exista conta ou não);
 * 2. o código e a senha nova. Deu certo, a pessoa já entra logada; as sessões abertas em outros
 *    aparelhos caem.
 */
export default function EsqueciSenha() {
  const { redefinirSenha } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { email?: string } };

  const [email, setEmail] = useState(location.state?.email ?? "");
  const [desafio, setDesafio] = useState<DesafioOtpResponse | null>(null);
  const [codigo, setCodigo] = useState("");
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [espera, setEspera] = useState(0);

  useEffect(() => {
    if (espera <= 0) return;
    const timer = window.setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [espera]);

  async function pedirCodigo(e?: FormEvent) {
    e?.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const novo = await esqueciSenha(email.trim());
      setDesafio(novo);
      setCodigo("");
      setEspera(INTERVALO_REENVIO);
    } catch (err) {
      const segundos = segundosParaReenviar(err);
      if (segundos !== null) {
        setEspera(segundos);
        setErro(mensagemDeEspera(segundos));
      } else {
        setErro(extrairMensagemErro(err, "Não foi possível enviar o código."));
      }
    } finally {
      setEnviando(false);
    }
  }

  const digitos = codigo.replace(/\D/g, "");
  const senhaCurta = senha.length > 0 && senha.length < SENHA_MINIMA;
  const naoConfere = repetida.length > 0 && repetida !== senha;
  const podeSalvar =
    !!desafio && digitos.length === 6 && senha.length >= SENHA_MINIMA && senha.length <= SENHA_MAXIMA && senha === repetida;

  async function salvar(e: FormEvent) {
    e.preventDefault();
    if (!desafio || !podeSalvar) return;
    setErro(null);
    setSalvando(true);
    try {
      await redefinirSenha(desafio.desafioId, digitos, senha);
      navigate("/clubes", { replace: true });
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível redefinir a senha."));
    } finally {
      setSalvando(false);
    }
  }

  if (!desafio) {
    return (
      <AuthLayout voltarPara="/entrar">
        <h1 className="font-serif text-2xl text-ink-900">esqueci a senha</h1>
        <p className="mt-1 text-sm text-muted-600">
          digite o e-mail da sua conta e enviamos um código para você criar uma senha nova
        </p>

        <form onSubmit={pedirCodigo} className="mt-6 flex flex-col gap-4">
          {erro && <ErrorBanner mensagem={erro} />}
          <TextField
            label="e-mail"
            type="email"
            autoComplete="email"
            placeholder="maria@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
            required
          />
          <Button type="submit" loading={enviando} disabled={espera > 0} fullWidth>
            {espera > 0 ? `aguarde ${espera}s` : "enviar código"}
          </Button>
          <p className="text-center text-sm text-muted-600">
            lembrou?{" "}
            <Link to="/entrar" className="font-semibold text-brand-600">
              entrar
            </Link>
          </p>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout voltarPara="/entrar">
      <h1 className="font-serif text-2xl text-ink-900">crie uma senha nova</h1>
      <p className="mt-1 text-sm text-muted-600">
        se houver uma conta com <span className="font-semibold text-ink-900">{email.trim()}</span>, o código de 6
        dígitos chega em instantes. Ele vale por 10 minutos.
      </p>

      <form onSubmit={salvar} className="mt-6 flex flex-col gap-4">
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
        <TextField
          label="senha nova"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={senha}
          maxLength={SENHA_MAXIMA}
          onChange={(e) => setSenha(e.target.value)}
          hint={`pelo menos ${SENHA_MINIMA} caracteres`}
          error={senhaCurta ? `use pelo menos ${SENHA_MINIMA} caracteres` : undefined}
          required
        />
        <TextField
          label="repita a senha nova"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          value={repetida}
          maxLength={SENHA_MAXIMA}
          onChange={(e) => setRepetida(e.target.value)}
          error={naoConfere ? "as senhas não são iguais" : undefined}
          required
        />

        <Button type="submit" loading={salvando} disabled={!podeSalvar} fullWidth>
          salvar senha e entrar
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Button
            type="button"
            variant="ghost"
            onClick={() => void pedirCodigo()}
            loading={enviando}
            disabled={espera > 0}
          >
            {espera > 0 ? `reenviar em ${espera}s` : "reenviar código"}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setDesafio(null);
              setErro(null);
              // O limite de reenvio é por e-mail: outro endereço não espera.
              setEspera(0);
            }}
          >
            trocar e-mail
          </Button>
        </div>

        <p className="text-center text-xs text-muted-500">
          ao salvar, você sai da conta nos outros aparelhos em que estava conectado.
        </p>
      </form>
    </AuthLayout>
  );
}
