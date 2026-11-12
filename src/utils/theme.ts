import type { TemaCor } from '../types/models';

export interface CorOpcao {
  nome: string;
  valor: string;
}

export const CORES_FUNDO_PASTEL: CorOpcao[] = [
  { nome: 'Verde-água', valor: '#DDF1F1' },
  { nome: 'Azul', valor: '#DFEBF8' },
  { nome: 'Lilás', valor: '#F0E4F4' },
  { nome: 'Rosa', valor: '#F9E2EB' },
  { nome: 'Pêssego', valor: '#FFF1DD' },
  { nome: 'Verde', valor: '#E6F3E9' },
  { nome: 'Amarelo', valor: '#FFFBE1' },
  { nome: 'Cinza', valor: '#E9EAEB' },
];

const CORES_LEGADAS: Record<string, string> = {
  '#0e4f4a': '#DDF1F1',
  '#1e3a5f': '#DFEBF8',
  '#3b2366': '#F0E4F4',
  '#6b1e3a': '#F9E2EB',
  '#7a4a12': '#FFF1DD',
  '#14532d': '#E6F3E9',
  '#5c4a0e': '#FFFBE1',
  '#33393b': '#E9EAEB',
};

const CORES_DESTAQUE: Record<string, string> = {
  '#ddf1f1': '#006D68',
  '#dfebf8': '#356F9F',
  '#f0e4f4': '#76508E',
  '#f9e2eb': '#A84E70',
  '#fff1dd': '#85550F',
  '#e6f3e9': '#39764E',
  '#fffbe1': '#866B16',
  '#e9eaeb': '#4E5A60',
};

const CORES_FUNDO_ESCURO: Record<string, string> = {
  '#ddf1f1': '#183B3D',
  '#dfebf8': '#1D354B',
  '#f0e4f4': '#36283D',
  '#f9e2eb': '#432832',
  '#fff1dd': '#453720',
  '#e6f3e9': '#243D2D',
  '#fffbe1': '#413B20',
  '#e9eaeb': '#303538',
};

export function normalizarCorFundo(corHex: string): string {
  const corNormalizada = corHex.toLowerCase();
  return CORES_LEGADAS[corNormalizada]
    ?? CORES_FUNDO_PASTEL.find((cor) => cor.valor.toLowerCase() === corNormalizada)?.valor
    ?? corHex;
}

export function corFundoNoTema(corHex: string, temaClaro: boolean): string {
  const corNormalizada = normalizarCorFundo(corHex);
  return temaClaro
    ? corNormalizada
    : CORES_FUNDO_ESCURO[corNormalizada.toLowerCase()] ?? corNormalizada;
}

export function corParaTemaCor(corHex: string): TemaCor {
  const cor = normalizarCorFundo(corHex).toLowerCase();
  if (cor === '#ddf1f1' || cor === '#e6f3e9') return 'forest-green';
  if (cor === '#dfebf8') return 'ocean-blue';
  if (cor === '#f0e4f4') return 'lavender-mist';
  if (cor === '#f9e2eb' || cor === '#fff1dd' || cor === '#fffbe1') return 'sunset-warm';
  return 'soft-pastel';
}

function corDeDestaque(corFundo: string): string {
  return CORES_DESTAQUE[corFundo.toLowerCase()]
    ?? misturarCores(corFundo, '#000000', 0.55);
}

function misturarCores(corA: string, corB: string, proporcaoB: number): string {
  const canaisA = corA.match(/[0-9a-f]{2}/gi)?.map((canal) => parseInt(canal, 16)) ?? [255, 255, 255];
  const canaisB = corB.match(/[0-9a-f]{2}/gi)?.map((canal) => parseInt(canal, 16)) ?? [0, 0, 0];
  const misturados = canaisA.map((canal, indice) => Math.round(canal * (1 - proporcaoB) + canaisB[indice] * proporcaoB));
  return `#${misturados.map((canal) => canal.toString(16).padStart(2, '0')).join('')}`;
}

function definirVariavel(root: HTMLElement, nome: string, valor: string): void {
  root.style.setProperty(`--tema-${nome}`, valor);
}

export function aplicarTema(temaClaro: boolean, _temaCorNome: TemaCor, corFundoHex: string): void {
  const root = document.documentElement;
  const corFundo = corFundoNoTema(corFundoHex, temaClaro);

  root.classList.remove('light', 'dark');
  root.classList.add(temaClaro ? 'light' : 'dark');
  document.body.classList.remove('light', 'dark');
  document.body.classList.add(temaClaro ? 'light' : 'dark');
  root.style.colorScheme = temaClaro ? 'light' : 'dark';
  document.body.style.colorScheme = temaClaro ? 'light' : 'dark';

  const cores = temaClaro
    ? {
      primary: corFundo,
      secondary: misturarCores(corFundo, '#000000', 0.035),
      textPrimary: '#202927',
      textSecondary: '#65736F',
      accent: corDeDestaque(corFundo),
      surface: misturarCores(corFundo, '#FFFFFF', 0.76),
      surfaceElevado: misturarCores(corFundo, '#FFFFFF', 0.9),
      border: misturarCores(corFundo, '#33423E', 0.17),
      input: misturarCores(corFundo, '#FFFFFF', 0.38),
    }
    : {
      primary: corFundo,
      secondary: misturarCores(corFundo, '#FFFFFF', 0.045),
      textPrimary: '#F4F4F5',
      textSecondary: '#A1A1AA',
      accent: CORES_DESTAQUE[normalizarCorFundo(corFundoHex).toLowerCase()] ?? corFundo,
      surface: misturarCores(corFundo, '#FFFFFF', 0.075),
      surfaceElevado: misturarCores(corFundo, '#FFFFFF', 0.13),
      border: misturarCores(corFundo, '#FFFFFF', 0.24),
      input: misturarCores(corFundo, '#FFFFFF', 0.1),
    };

  root.style.setProperty('--color-background', corFundo);
  root.style.setProperty('--color-foreground', temaClaro ? '#202927' : '#F4F4F5');
  definirVariavel(root, 'primary', cores.primary);
  definirVariavel(root, 'secondary', cores.secondary);
  definirVariavel(root, 'text-primary', cores.textPrimary);
  definirVariavel(root, 'text-secondary', cores.textSecondary);
  definirVariavel(root, 'accent', cores.accent);
  definirVariavel(root, 'surface', cores.surface);
  definirVariavel(root, 'surface-elevado', cores.surfaceElevado);
  definirVariavel(root, 'border', cores.border);
  definirVariavel(root, 'input', cores.input);
  definirVariavel(root, 'cor-fundo', corFundo);
}
