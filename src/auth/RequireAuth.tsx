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
  if (usuario) return <Navigate to="/clubes" replace />;
  return <>{children}</>;
}
