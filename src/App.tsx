import { useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Home } from './pages/Home';
import { Splash } from './pages/Splash';
import { FirstRun } from './pages/FirstRun';
import { Landing } from './pages/Landing';
import { LockScreen } from './pages/Lock';
import { DespesaForm } from './pages/DespesaForm';
import { Relatorios } from './pages/Relatorios';
import { Cartoes } from './pages/Cartoes';
import { CartaoDetalhe } from './pages/CartaoDetalhe';
import { CartaoForm } from './pages/CartaoForm';
import { Diagnostico } from './pages/Diagnostico';
import { Perfil } from './pages/Perfil';
import { aplicarTema } from './utils/theme';
import type { TemaCor } from './types/models';
import { useMangoStore } from './store/useStore';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { AuthCallback } from './pages/AuthCallback';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { License } from './pages/License';
import { TermosDeServico } from './pages/TermosDeServico';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  const { perfil, idioma } = useMangoStore();

  useEffect(() => {
    document.documentElement.lang = idioma;
  }, [idioma]);

  // Restaura o tema salvo do perfil ao montar o app
  useEffect(() => {
    if (perfil) {
      const corFundoHex = `#${perfil.corFundo.toString(16).padStart(6, '0')}`;
      const temaCor = (perfil.temaCor as TemaCor) ?? 'soft-pastel';
      aplicarTema(perfil.temaClaro, temaCor, corFundoHex);
    }
  }, [perfil]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas públicas (sem autenticação) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/auth/reset-password" element={<ResetPassword />} />
        <Route path="/license" element={<License />} />
        <Route path="/termos-de-servico" element={<TermosDeServico />} />

        {/* Rotas protegidas (requerem autenticação) */}
        <Route path="/" element={<ProtectedRoute />}>
          <Route index element={<Home />} />
          <Route path="splash" element={<Splash />} />
          <Route path="first-run" element={<FirstRun />} />
          <Route path="landing" element={<Landing />} />
          <Route path="lock" element={<LockScreen onUnlock={() => {}} />} />
          <Route path="despesa/nova" element={<DespesaForm />} />
          <Route path="receita/nova" element={<DespesaForm tipoInicial="receita" />} />
          <Route path="despesa/editar/:id" element={<DespesaForm />} />
          <Route path="relatorios" element={<Relatorios />} />
          <Route path="cartoes" element={<Cartoes />} />
          <Route path="cartao/:id" element={<CartaoDetalhe />} />
          <Route path="cartao/nova" element={<CartaoForm />} />
          <Route path="cartao/editar/:id" element={<CartaoForm />} />
          <Route path="diagnostico" element={<Diagnostico />} />
          <Route path="perfil" element={<Perfil />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
