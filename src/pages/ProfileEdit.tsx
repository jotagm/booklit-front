import { useState } from "react";
import type { FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { extrairMensagemErro } from "../api/client";
import { TextAreaField, TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";

export default function ProfileEdit() {
  const { usuario, atualizarPerfil, editarPerfilPublico } = useAuth();
  const navigate = useNavigate();
  const location = useLocation() as { state?: { focoSenha?: boolean } };

  const [nome, setNome] = useState(usuario?.nome ?? "");
  const [email, setEmail] = useState(usuario?.email ?? "");
  const [bio, setBio] = useState(usuario?.bio ?? "");
  const [senha, setSenha] = useState("");
  const [salvandoPerfil, setSalvandoPerfil] = useState(false);
  const [perfilSalvo, setPerfilSalvo] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  // Nome e bio: o que os outros leitores veem. Não pede senha.
  async function onSubmitPerfil(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setPerfilSalvo(false);
    setSalvandoPerfil(true);
    try {
      await editarPerfilPublico({ nome: nome.trim(), bio: bio.trim() || null });
      setPerfilSalvo(true);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível salvar o perfil."));
    } finally {
      setSalvandoPerfil(false);
    }
  }

  // E-mail e senha: o backend exige a senha e reenvia o nome atual junto.
  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErro(null);
    setEnviando(true);
    try {
      await atualizarPerfil({ nome: usuario?.nome ?? nome.trim(), email: email.trim(), senha });
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

      <form onSubmit={onSubmitPerfil} className="flex flex-col gap-4">
        <h2 className="section-label">perfil público</h2>
        <TextField label="nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
        <TextAreaField
          label="bio"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          maxLength={160}
          rows={3}
          placeholder="uma frase sobre você como leitor(a)"
          counter={{ current: bio.length, max: 160 }}
        />
        {perfilSalvo && <p className="text-sm text-brand-600">perfil atualizado!</p>}
        <Button type="submit" fullWidth loading={salvandoPerfil}>
          salvar perfil
        </Button>
      </form>

      <form onSubmit={onSubmit} className="mt-8 flex flex-col gap-4 border-t border-ink-800/10 pt-6">
        <h2 className="section-label">conta</h2>
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
          hint="o backend exige a senha a cada atualização de e-mail ou senha — repita a atual se não quiser trocá-la."
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          autoFocus={location.state?.focoSenha}
          minLength={6}
          required
        />

        <Button type="submit" fullWidth loading={enviando} className="mt-1">
          salvar e-mail e senha
        </Button>
      </form>
    </div>
  );
}
