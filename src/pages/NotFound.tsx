import { Link } from "react-router-dom";
import Button from "../components/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-cream-100 px-6 text-center">
      <p className="font-serif text-3xl text-ink-900">página não encontrada</p>
      <p className="text-sm text-muted-600">o endereço acessado não existe ou foi movido.</p>
      <Link to="/clubes">
        <Button>voltar para meus clubes</Button>
      </Link>
    </div>
  );
}
