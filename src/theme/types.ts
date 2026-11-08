// Theme types for multiple color choices
// Inspired by Flutter Dart theming but adapted for web/React

export type TemaClaroEscuro = 'claro' | 'escuro' | 'sistema'

export type TemaCor = 'soft-pastel' | 'ocean-blue' | 'forest-green' | 'sunset-warm' | 'lavender-mist' | 'personalizado'

export interface CoresTema {
  // Primary background color for the theme
  primary: string
  // Secondary background color (for cards, etc.)
  secondary: string
  // Text colors
  text_primary: string
  text_secondary: string
  // Accent color
  accent: string
  // Surface colors
  surface: string
  surface_elevated: string
}

// Define multiple soothing color themes
export const temasDisponiveis: Partial<Record<TemaCor, CoresTema>> = {
  // Tema pastel suave - cores suaves e agradáveis
  'soft-pastel': {
    primary: '#F8F9FA',
    secondary: '#E9ECEF',
    text_primary: '#212529',
    text_secondary: '#6C757D',
    accent: '#6C63FF',
    surface: '#FFFFFF',
    surface_elevated: '#F8F9FA',
  },

  // Tema ocean blue - tons de azul relaxantes
  'ocean-blue': {
    primary: '#E3F2FD',
    secondary: '#BBDEFB',
    text_primary: '#1A237E',
    text_secondary: '#42A5F5',
    accent: '#2196F3',
    surface: '#FFFDE7',
    surface_elevated: '#E3F2FD',
  },

  // Tema forest green - verdes terrosos e tranquilos
  'forest-green': {
    primary: '#E8F5E9',
    secondary: '#C8E6C9',
    text_primary: '#2E7D32',
    text_secondary: '#66BB6A',
    accent: '#43A047',
    surface: '#F1F8E9',
    surface_elevated: '#E8F5E9',
  },

  // Tema sunset warm - tons quentes e acolhedores
  'sunset-warm': {
    primary: '#FFF3E0',
    secondary: '#FFE0B2',
    text_primary: '#E65100',
    text_secondary: '#FB8C00',
    accent: '#FF9800',
    surface: '#FFF8E1',
    surface_elevated: '#FFF3E0',
  },

  // Tema lavender mist - roxos suaves e misteriosos
  'lavender-mist': {
    primary: '#F3E5F5',
    secondary: '#E1BEE7',
    text_primary: '#4A148C',
    text_secondary: '#AB47BC',
    accent: '#CE93D8',
    surface: '#FAF0F8',
    surface_elevated: '#F3E5F5',
  },
}

// Tema padrão se nenhum for selecionado
export const temaPadrao: TemaCor = 'soft-pastel'

// Tipos para perfil do usuário
export interface UserProfile {
  id: string
  temaClaro: boolean // true = claro, false = escuro
  temaCor: TemaCor // cor do tema preferida
  corFundo: string // cor de fundo personalizada (hex)
  // Outros campos do perfil...
}

// Estado do tema
export interface ThemeState {
  modo: TemaClaroEscuro
  temaCor: TemaCor
  cores: CoresTema
  corFundo: string
}