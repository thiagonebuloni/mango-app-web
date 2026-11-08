// Theme service for multiple soothing color choices
// Inspired by Flutter Dart theming but adapted for web/React

// Temas disponíveis com cores tranquilizantes
export const temasDisponiveis: Record<string, {
  primary: string
  secondary: string
  text_primary: string
  text_secondary: string
  accent: string
  surface: string
  surface_elevado: string
}> = {
  // Tema pastel suave - cores suaves e agradáveis (padrão)
  soft_pastel: {
    primary: '#F8F9FA',
    secondary: '#E9ECEF',
    text_primary: '#212529',
    text_secondary: '#6C757D',
    accent: '#6C63FF',
    surface: '#FFFFFF',
    surface_elevado: '#F8F9FA',
  },

  // Tema ocean blue - tons de azul relaxantes
  ocean_blue: {
    primary: '#E3F2FD',
    secondary: '#BBDEFB',
    text_primary: '#1A237E',
    text_secondary: '#42A5F5',
    accent: '#2196F3',
    surface: '#FFFDE7',
    surface_elevado: '#E3F2FD',
  },

  // Tema forest green - verdes terrosos e tranquilos
  forest_green: {
    primary: '#E8F5E9',
    secondary: '#C8E6C9',
    text_primary: '#2E7D32',
    text_secondary: '#66BB6A',
    accent: '#43A047',
    surface: '#F1F8E9',
    surface_elevado: '#E8F5E9',
  },

  // Tema sunset warm - tons quentes e acolhedores
  sunset_warm: {
    primary: '#FFF3E0',
    secondary: '#FFE0B2',
    text_primary: '#E65100',
    text_secondary: '#FB8C00',
    accent: '#FF9800',
    surface: '#FFF8E1',
    surface_elevado: '#FFF3E0',
  },

  // Tema lavender mist - roxos suaves e misteriosos
  lavender_mist: {
    primary: '#F3E5F5',
    secondary: '#E1BEE7',
    text_primary: '#4A148C',
    text_secondary: '#AB47BC',
    accent: '#CE93D8',
    surface: '#FAF0F8',
    surface_elevado: '#F3E5F5',
  },
}

// Retorna as cores de um tema pelo nome
export function obterTema(temaNome: string): {
  primary: string
  secondary: string
  text_primary: string
  text_secondary: string
  accent: string
  surface: string
  surface_elevado: string
} | null {
  return temasDisponiveis[temaNome] || null
}

// Tipo de tema de cor
export type TemaCor = 'soft-pastel' | 'ocean-blue' | 'forest-green' | 'sunset-warm' | 'lavender-mist' | 'personalizado'

// Estado do tema
export interface ThemeState {
  modo: 'claro' | 'escuro'
  temaCor: TemaCor
  corFundo: string
}