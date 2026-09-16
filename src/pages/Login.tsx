import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";
import { useAuth } from "../auth/AuthContext";
import { extrairMensagemErro } from "../api/client";
import AuthTabs from "../components/AuthTabs";

export default function Login() {
  const { entrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await entrar(email, senha);
      const destino = location.state?.from?.pathname ?? "/clubes";
      navigate(destino, { replace: true });
    } catch (err) {
      setErro(extrairMensagemErro(err, "E-mail ou senha inválidos."));
    } finally {
      setEnviando(false);
    }
  }

  return (
    <AuthLayout voltarPara="/">
      <h1 className="font-serif text-2xl text-ink-900">entrar</h1>
      <p className="mt-1 text-sm text-muted-600">bem-vindo de volta</p>

      <AuthTabs ativo="entrar" className="mt-5" />

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        {erro && <ErrorBanner mensagem={erro} />}

        <TextField
          label="e-mail"
          type="email"
          autoComplete="email"
          placeholder="maria@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="senha"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <div className="-mt-2 text-right">
          <span className="text-xs text-muted-500">esqueci a senha</span>
        </div>

        <Button type="submit" loading={enviando} fullWidth>
          entrar
        </Button>

        <p className="text-center text-sm text-muted-600">
          não tem conta?{" "}
          <Link to="/cadastro" className="font-semibold text-brand-600">
            criar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
