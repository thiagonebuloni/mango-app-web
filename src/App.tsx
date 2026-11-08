import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar } from './components/Sidebar';
import { SidebarMenuContext } from './components/SidebarMenuContext';
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
import { SupabaseAuthGate } from './components/SupabaseAuthGate';
import { Login } from './pages/Login';
import { Register } from './pages/Register';

function App() {
  const { perfil, idioma } = useMangoStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <SupabaseAuthGate>
        <SidebarMenuContext.Provider value={() => setSidebarOpen(true)}>
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/splash" element={<Splash />} />
            <Route path="/first-run" element={<FirstRun />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/lock" element={<LockScreen onUnlock={() => {}} />} />
            <Route path="/despesa/nova" element={<DespesaForm />} />
            <Route path="/receita/nova" element={<DespesaForm tipoInicial="receita" />} />
            <Route path="/despesa/editar/:id" element={<DespesaForm />} />
            <Route path="/relatorios" element={<Relatorios />} />
            <Route path="/cartoes" element={<Cartoes />} />
            <Route path="/cartao/:id" element={<CartaoDetalhe />} />
            <Route path="/cartao/nova" element={<CartaoForm />} />
            <Route path="/cartao/editar/:id" element={<CartaoForm />} />
            <Route path="/diagnostico" element={<Diagnostico />} />
            <Route path="/perfil" element={<Perfil />} />
            <Route path="/" element={<Home />} />
          </Routes>
        </SidebarMenuContext.Provider>
      </SupabaseAuthGate>
    </BrowserRouter>
  );
}

export default App;
