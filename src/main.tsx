import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { inicializarStore } from './store/useStore';

// Carrega dados persistidos (IndexedDB) antes de montar a UI
inicializarStore().catch((e) => console.error('Falha ao inicializar store:', e));

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
