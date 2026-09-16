import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function Welcome() {
  return (
    <div className="flex min-h-screen w-full justify-center bg-cream-100 px-6 py-10">
      <div className="flex w-full max-w-sm flex-col">
        <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-500">
            <div className="h-3.5 w-3.5 rounded-sm bg-cream-50" />
          </div>
          <div>
            <h1 className="font-serif text-3xl text-ink-900">
              clube <span className="italic">do livro</span>
            </h1>
            <p className="mt-2 text-sm text-muted-600">o espaço do seu grupo de leitura</p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pb-4">
          <Link to="/entrar">
            <Button fullWidth>entrar</Button>
          </Link>
          <Link to="/cadastro">
            <Button variant="secondary" fullWidth>
              criar conta
            </Button>
          </Link>
          <button
            type="button"
            disabled
            title="Login social ainda não disponível nesta versão web"
            className="mt-1 text-center text-xs text-muted-500/70"
          >
            continuar com Google (em breve)
          </button>
        </div>
      </div>
    </div>
  );
}
