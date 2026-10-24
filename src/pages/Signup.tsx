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
import EtapaDoCodigo from "../components/EtapaDoCodigo";
import type { DesafioOtpResponse } from "../api/types";

export default function Signup() {
  const { cadastrar } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { from?: { pathname: string } } };

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [desafio, setDesafio] = useState<DesafioOtpResponse | null>(null);

  const irParaDestino = () => navigate(location.state?.from?.pathname ?? "/clubes", { replace: true });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      const resultado = await cadastrar(nome, email, senha);
      if (resultado.etapa === "codigo") {
        setDesafio(resultado.desafio);
      } else {
        irParaDestino();
      }
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível criar sua conta."));
    } finally {
      setEnviando(false);
    }
  }

  // A conta já foi criada: "voltar" leva ao login, não ao formulário (que daria e-mail repetido).
  if (desafio) {
    return (
      <AuthLayout voltarPara="/">
        <EtapaDoCodigo
          email={email}
          senha={senha}
          desafio={desafio}
          onConcluido={irParaDestino}
          onVoltar={() => navigate("/entrar", { state: location.state })}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout voltarPara="/">
      <h1 className="font-serif text-2xl text-ink-900">criar conta</h1>
      <p className="mt-1 text-sm text-muted-600">junte-se ao seu clube de leitura</p>

      <AuthTabs ativo="cadastro" className="mt-5" />

      <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-4">
        {erro && <ErrorBanner mensagem={erro} />}

        <TextField
          label="nome"
          placeholder="seu nome"
          autoComplete="name"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <TextField
          label="e-mail"
          type="email"
          placeholder="seu@email.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="senha"
          type="password"
          placeholder="••••••••"
          autoComplete="new-password"
          minLength={6}
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />

        <Button type="submit" loading={enviando} fullWidth className="mt-1">
          criar conta
        </Button>

        <p className="text-center text-sm text-muted-600">
          já tem conta?{" "}
          <Link to="/entrar" state={location.state} className="font-semibold text-brand-600">
            entrar
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}
