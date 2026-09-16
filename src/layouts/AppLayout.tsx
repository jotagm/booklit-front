import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import Avatar from "../components/Avatar";
import { IconeClubes, IconeLeituras, IconePerfil, Logo } from "../components/NavIcons";

// Duas formas do mesmo shell, como no mock.pdf: sidebar fixa no desktop (lg+)
// e barra inferior no mobile.
const abas = [
  { to: "/clubes", label: "clubes", labelLongo: "meus clubes", icon: IconeClubes },
  { to: "/leituras", label: "leituras", labelLongo: "leituras ativas", icon: IconeLeituras },
  { to: "/perfil", label: "perfil", labelLongo: "perfil", icon: IconePerfil },
];

export default function AppLayout() {
  const { usuario, sair } = useAuth();
  const navigate = useNavigate();

  function logout() {
    sair();
    navigate("/", { replace: true });
  }

  return (
    <div className="min-h-screen bg-cream-200">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-72 flex-col border-r border-ink-800/10 bg-cream-50 px-5 py-7 lg:flex">
        <NavLink to="/clubes" className="mb-8 px-2">
          <Logo />
        </NavLink>

        <nav className="flex flex-col gap-1">
          {abas.map(({ to, labelLongo, icon: Icone }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  isActive
                    ? "bg-brand-50 font-semibold text-brand-700"
                    : "text-ink-800 hover:bg-ink-800/5"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icone ativo={isActive} />
                  {labelLongo}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {usuario && (
          <div className="mt-auto flex items-center gap-3 border-t border-ink-800/10 pt-5">
            <Avatar nome={usuario.nome} size="md" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-ink-900">{usuario.nome}</p>
              <button
                onClick={logout}
                className="text-xs text-brand-600 hover:text-brand-700 hover:underline"
              >
                sair da conta
              </button>
            </div>
          </div>
        )}
      </aside>

      <main className="min-h-screen pb-24 lg:pb-0 lg:pl-72">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-ink-800/10 bg-cream-50/95 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-3xl items-center justify-around py-2">
          {abas.map(({ to, label, icon: Icone }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 rounded-xl px-6 py-1.5 text-[11px] font-medium ${
                  isActive ? "text-brand-600" : "text-muted-500"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icone ativo={isActive} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
}
