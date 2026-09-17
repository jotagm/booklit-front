import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import RequireAuth, { RedirectIfAuth } from "./auth/RequireAuth";
import AppLayout from "./layouts/AppLayout";

import Welcome from "./pages/Welcome";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ClubList from "./pages/ClubList";
import ClubCreateStep1 from "./pages/ClubCreateStep1";
import ClubCreateStep2 from "./pages/ClubCreateStep2";
import ClubDetail from "./pages/ClubDetail";
import LeituraCreate from "./pages/LeituraCreate";
import LeituraDetail from "./pages/LeituraDetail";
import LeiturasAtivas from "./pages/LeiturasAtivas";
import Livros from "./pages/Livros";
import VotacaoCreate from "./pages/VotacaoCreate";
import VotacaoDetail from "./pages/VotacaoDetail";
import Profile from "./pages/Profile";
import ProfileEdit from "./pages/ProfileEdit";
import NotFound from "./pages/NotFound";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route
          path="/"
          element={
            <RedirectIfAuth>
              <Welcome />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/entrar"
          element={
            <RedirectIfAuth>
              <Login />
            </RedirectIfAuth>
          }
        />
        <Route
          path="/cadastro"
          element={
            <RedirectIfAuth>
              <Signup />
            </RedirectIfAuth>
          }
        />

        {/* Fluxo de criação de clube usa o próprio AuthLayout/telas cheias (sem bottom nav) */}
        <Route element={<RequireAuth />}>
          <Route path="/clubes/novo" element={<ClubCreateStep1 />} />
          <Route path="/clubes/novo/:clubeId/convidar" element={<ClubCreateStep2 />} />
          <Route path="/clubes/:clubeId/leituras/nova" element={<LeituraCreate />} />
          <Route path="/clubes/:clubeId/votacoes/nova" element={<VotacaoCreate />} />
          <Route path="/perfil/editar" element={<ProfileEdit />} />
        </Route>

        {/* Área principal do app, com bottom nav */}
        <Route element={<RequireAuth />}>
          <Route element={<AppLayout />}>
            <Route path="/clubes" element={<ClubList />} />
            <Route path="/clubes/:clubeId" element={<ClubDetail />} />
            <Route path="/leituras" element={<LeiturasAtivas />} />
            <Route path="/livros" element={<Livros />} />
            <Route path="/leituras/:leituraId" element={<LeituraDetail />} />
            <Route path="/votacoes/:votacaoId" element={<VotacaoDetail />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
        </Route>

        <Route path="/404" element={<NotFound />} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Routes>
    </AuthProvider>
  );
}
