import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { extrairMensagemErro } from "../api/client";
import { TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";

export default function ProfileEdit() {
  const { usuario, atualizarPerfil } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { focoSenha?: boolean } };

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [senha, setSenha] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await atualizarPerfil({ nome: nome.trim(), email: email.trim(), senha });
      navigate("/perfil", { replace: true });
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível salvar as alterações."));
    } finally {
      setEnviando(false);
    }
  }

  if (!usuario) return null;

  return (
    <div className="px-4 pt-6">
      <Link to="/perfil" className="text-sm text-muted-600 hover:text-ink-800">
        ← voltar
      </Link>
      <h1 className="mt-3 mb-5 font-serif text-2xl text-ink-900">editar perfil</h1>

      {erro && (
        <div className="mb-4">
          <ErrorBanner mensagem={erro} />
        </div>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <TextField label="nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <TextField
          label="e-mail"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <TextField
          label="senha"
          type="password"
          placeholder="digite para confirmar ou trocar a senha"
          hint="o backend exige a senha a cada atualização de perfil — repita a atual se não quiser trocá-la."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus={location.state?.focoSenha}
          minLength={6}
          required
        />

        <Button type="submit" fullWidth loading={enviando} className="mt-1">
          salvar alterações
        </Button>
      </form>
    </div>
  );
}
