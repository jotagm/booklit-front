import { useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import { extrairMensagemErro } from "../api/client";
import { validarFoto } from "../api/foto";
import Avatar from "../components/Avatar";
import { TextAreaField, TextField } from "../components/TextField";
import Button from "../components/Button";
import { ErrorBanner } from "../components/Feedback";

export default function ProfileEdit() {
  const { usuario, atualizarPerfil, editarPerfilPublico, trocarFoto, removerFoto } = useAuth();
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
  const [trabalhandoNaFoto, setTrabalhandoNaFoto] = useState(false);
  const seletorDeFoto = useRef<HTMLInputElement>(null);

  async function onEscolherFoto(e: ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = ""; // deixa escolher o mesmo arquivo de novo depois de um erro
    if (!arquivo) return;
    const problema = validarFoto(arquivo);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    setTrabalhandoNaFoto(true);
    try {
      await trocarFoto(arquivo);
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível trocar a foto."));
    } finally {
      setTrabalhandoNaFoto(false);
    }
  }

  async function onRemoverFoto() {
    setErro(null);
    setTrabalhandoNaFoto(true);
    try {
      await removerFoto();
    } catch (err) {
      setErro(extrairMensagemErro(err, "Não foi possível remover a foto."));
    } finally {
      setTrabalhandoNaFoto(false);
    }
  }

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

      <section className="mb-6 flex items-center gap-4">
        <Avatar nome={usuario.nome} usuarioId={usuario.id} size="lg" fotoUrl={usuario.fotoUrl} />
        <div className="flex flex-col items-start gap-2">
          <input
            ref={seletorDeFoto}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={onEscolherFoto}
          />
          <Button
            type="button"
            variant="secondary"
            loading={trabalhandoNaFoto}
            onClick={() => seletorDeFoto.current?.click()}
          >
            {usuario.fotoUrl ? "trocar foto" : "adicionar foto"}
          </Button>
          {usuario.fotoUrl && !trabalhandoNaFoto && (
            <button type="button" onClick={onRemoverFoto} className="text-sm text-muted-600 hover:text-ink-800">
              remover foto
            </button>
          )}
          <p className="text-xs text-muted-500">JPEG, PNG ou WebP, até 2 MB</p>
        </div>
      </section>

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
