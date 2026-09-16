import { Link } from "react-router-dom";

export default function AuthTabs({
  ativo,
  className = "",
}: {
  ativo: "cadastro" | "entrar";
  className?: string;
}) {
  return (
    <div className={`flex rounded-full bg-ink-800/5 p-1 text-sm font-semibold ${className}`}>
      <Link
        to="/cadastro"
        className={`flex-1 rounded-full py-2 text-center transition-colors ${
          ativo === "cadastro" ? "bg-cream-50 text-ink-900 shadow-sm" : "text-muted-500"
        }`}
      >
        cadastro
      </Link>
      <Link
        to="/entrar"
        className={`flex-1 rounded-full py-2 text-center transition-colors ${
          ativo === "entrar" ? "bg-cream-50 text-ink-900 shadow-sm" : "text-muted-500"
        }`}
      >
        entrar
      </Link>
    </div>
  );
}
