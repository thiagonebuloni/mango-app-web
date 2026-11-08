import type { TemaCor } from '../types/models';

// Aplica as cores do tema globalmente no documento (CSS custom properties)
export function aplicarTema(temaClaro: boolean, _temaCorNome: TemaCor, corFundoHex: string) {
  const root = document.documentElement;

  // Modo claro/escuro
  root.classList.remove('light', 'dark');
  root.classList.add(temaClaro ? 'light' : 'dark');
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(temaClaro ? 'light' : 'dark');
  root.style.colorScheme = temaClaro ? 'light' : 'dark';
  document.body.style.colorScheme = temaClaro ? 'light' : 'dark';

  const coresNeutras = temaClaro
    ? {
        primary: '#FFFFFF',
      secondary: '#E4E4E7',
        textPrimary: '#18181B',
      textSecondary: '#52525B',
      surface: '#F4F4F5',
      surfaceElevado: '#E4E4E7',
      border: '#8B8B94',
      input: '#E4E4E7',
      }
    : {
        primary: '#0D0F0F',
        secondary: '#181A1A',
        textPrimary: '#F4F4F5',
        textSecondary: '#A1A1AA',
        surface: '#181A1A',
        surfaceElevado: '#242727',
        border: '#333636',
        input: '#242727',
      };

  root.style.setProperty('--tema-primary', coresNeutras.primary);
  root.style.setProperty('--tema-secondary', coresNeutras.secondary);
  root.style.setProperty('--tema-text-primary', coresNeutras.textPrimary);
  root.style.setProperty('--tema-text-secondary', coresNeutras.textSecondary);
  root.style.setProperty('--tema-accent', corFundoHex);
  root.style.setProperty('--tema-surface', coresNeutras.surface);
  root.style.setProperty('--tema-surface-elevado', coresNeutras.surfaceElevado);
  root.style.setProperty('--tema-border', coresNeutras.border);
  root.style.setProperty('--tema-input', coresNeutras.input);
  root.style.setProperty('--tema-cor-fundo', corFundoHex);
}
