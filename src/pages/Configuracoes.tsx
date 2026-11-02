import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import versao from "../../version.json";

const CHAVE_NOTIFICACOES = "clube-livro:notificacoes";

/** O que saiu da vitrine do perfil: conta, preferências, sair e versão. */
export default function Configuracoes() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();
  const [notificacoes, setNotificacoes] = useState(() => localStorage.getItem(CHAVE_NOTIFICACOES) !== "false");

  function alternarNotificacoes() {
    setNotificacoes((prev) => {
      const novo = !prev;
      localStorage.setItem(CHAVE_NOTIFICACOES, String(novo));
      return novo;
    });
  }

  function logout() {
    sair();
    navigate("/", { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 lg:px-10 lg:pt-10">
      <Link to="/perfil" className="text-sm text-muted-600 hover:text-ink-800">
        ← perfil
      </Link>
      <h1 className="mb-6 mt-3 font-serif text-[28px] font-bold text-ink-900 lg:text-4xl">configurações</h1>

      <div className="flex flex-col gap-6">
        <section>
          <h2 className="section-label">conta</h2>
          <div className="card divide-y divide-ink-800/10">
            <Link to="/perfil/editar" className="flex items-center justify-between px-5 py-4 hover:bg-ink-800/[0.03]">
              <div>
                <p className="text-[15px] text-ink-900">dados pessoais</p>
                <p className="text-xs text-muted-500">{usuario?.email ?? "nome e e-mail"}</p>
              </div>
              <span className="text-muted-400">›</span>
            </Link>
            <Link
              to="/perfil/editar"
              state={{ focoSenha: true }}
              className="flex items-center justify-between px-5 py-4 hover:bg-ink-800/[0.03]"
            >
              <div>
                <p className="text-[15px] text-ink-900">senha</p>
                <p className="text-xs text-muted-500">alterar senha</p>
              </div>
              <span className="text-muted-400">›</span>
            </Link>
          </div>
        </section>

        <section>
          <h2 className="section-label">preferências</h2>
          <div className="card flex items-center justify-between px-5 py-4">
            <div>
              <p className="text-[15px] text-ink-900">notificações</p>
              <p className="text-xs text-muted-500">salvo só neste dispositivo</p>
            </div>
            <button
              onClick={alternarNotificacoes}
              className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
                notificacoes ? "bg-brand-500" : "bg-ink-800/15"
              }`}
              aria-pressed={notificacoes}
              aria-label="notificações"
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-cream-50 shadow transition-transform ${
                  notificacoes ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>
        </section>

        <button
          onClick={logout}
          className="w-full rounded-full border border-red-200 bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100"
        >
          sair da conta
        </button>

        <p className="text-center text-xs text-muted-500">Booklit v{versao.version}</p>
      </div>
    </div>
  );
}
