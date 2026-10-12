import type { ReactNode } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";

export default function RequireAuth() {
  const { usuario } = useAuth();
  const location = useLocation();

  if (!usuario) {
    return <Navigate to="/entrar" replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export function RedirectIfAuth({ children }: { children: ReactNode }) {
  const { usuario } = useAuth();
  const location = useLocation() as { state?: { from?: { pathname: string } } };
  // Respeita o destino pedido (ex: o link de convite que mandou a pessoa logar).
  if (usuario) return <Navigate to={location.state?.from?.pathname ?? "/clubes"} replace />;
  return <>{children}</>;
}
