// Modelos de domínio do app Mango (traduzidos do Dart → TypeScript)
// Enums substituídos por objetos `const` por causa de `erasableSyntaxOnly`.

// ---------------- Categorias ----------------

export const Category = {
  alimentacao: 'alimentacao',
  transporte: 'transporte',
  mercado: 'mercado',
  vestuario: 'vestuario',
  saude: 'saude',
  lazer: 'lazer',
  moradia: 'moradia',
  outros: 'outros',
  salario: 'salario',
  investimentos: 'investimentos',
  bonificacao: 'bonificacao',
  freelance: 'freelance',
  rendaExtra: 'rendaExtra',
  aluguel: 'aluguel',
  pensao: 'pensao',
} as const;

export type Category = typeof Category[keyof typeof Category];

export type EntryKind = 'receita' | 'despesa';

export const CATEGORY_LABELS: Record<Category, string> = {
  [Category.alimentacao]: 'Alimentação',
  [Category.transporte]: 'Transporte',
  [Category.mercado]: 'Mercado',
  [Category.vestuario]: 'Vestuário',
  [Category.saude]: 'Saúde',
  [Category.lazer]: 'Lazer',
  [Category.moradia]: 'Moradia',
  [Category.outros]: 'Outros',
  [Category.salario]: 'Salário',
  [Category.investimentos]: 'Investimentos',
  [Category.bonificacao]: 'Bonificação',
  [Category.freelance]: 'Freelance',
  [Category.rendaExtra]: 'Renda extra',
  [Category.aluguel]: 'Aluguel',
  [Category.pensao]: 'Pensão',
};

export const CATEGORY_DESPESAS: Category[] = [
  Category.alimentacao,
  Category.transporte,
  Category.mercado,
  Category.vestuario,
  Category.saude,
  Category.lazer,
  Category.moradia,
  Category.outros,
];

export const CATEGORY_RECEITAS: Category[] = [
  Category.salario,
  Category.investimentos,
  Category.bonificacao,
  Category.freelance,
  Category.rendaExtra,
  Category.aluguel,
  Category.pensao,
];

export function categoryIsReceita(c: Category): boolean {
  return CATEGORY_RECEITAS.includes(c);
}

export function categoryParaTipo(tipo: EntryKind): Category[] {
  return tipo === 'receita' ? CATEGORY_RECEITAS : CATEGORY_DESPESAS;
}

export function categoryFromName(
  name: string | undefined,
  tipo?: EntryKind,
): Category {
  if (!name) return tipo === 'receita' ? Category.salario : Category.outros;
  const found = Object.values(Category).find((c) => c === name);
  if (found) return found;
  return tipo === 'receita' ? Category.salario : Category.outros;
}

// ---------------- Formas de pagamento ----------------

export const PaymentMethod = {
  dinheiro: 'dinheiro',
  debito: 'debito',
  credito: 'credito',
  pix: 'pix',
  outros: 'outros',
} as const;

export type PaymentMethod =
  typeof PaymentMethod[keyof typeof PaymentMethod];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  [PaymentMethod.dinheiro]: 'Dinheiro',
  [PaymentMethod.debito]: 'Débito',
  [PaymentMethod.credito]: 'Crédito',
  [PaymentMethod.pix]: 'PIX',
  [PaymentMethod.outros]: 'Outros',
};

// ---------------- Bandeiras de cartão ----------------

export const BandeiraCartao = {
  visa: 'visa',
  mastercard: 'mastercard',
  elo: 'elo',
  hipercard: 'hipercard',
  outros: 'outros',
} as const;

export type BandeiraCartao =
  typeof BandeiraCartao[keyof typeof BandeiraCartao];

export const BANDEIRA_LABELS: Record<BandeiraCartao, string> = {
  [BandeiraCartao.visa]: 'Visa',
  [BandeiraCartao.mastercard]: 'Mastercard',
  [BandeiraCartao.elo]: 'Elo',
  [BandeiraCartao.hipercard]: 'Hipercard',
  [BandeiraCartao.outros]: 'Outros',
};

// ---------------- Despesa / Receita ----------------

export interface Expense {
  id?: number;
  estabelecimento: string;
  valorCentavos: int;
  categoria: Category;
  formaPagamento: PaymentMethod;
  data: string; // ISO YYYY-MM-DD
  cartaoId?: number;
  fotoPath?: string;
  parcelado?: boolean;
  parcelaAtual?: int;
  totalParcelas?: int;
  grupoParcela?: string;
  observacao?: string;
  criadoEm?: string;
  atualizadoEm?: string;
}

export interface ExpenseInput {
  estabelecimento: string;
  valorCentavos: int;
  categoria: Category;
  formaPagamento: PaymentMethod;
  data: string;
  cartaoId?: number;
  fotoPath?: string;
  observacao?: string;
}

// ---------------- Cartão de crédito ----------------

export interface CartaoCredito {
  id?: number;
  banco: string;
  bandeira: BandeiraCartao;
  nome: string;
  diaFechamento: int;
  diaPagamento: int;
  limiteCentavos?: number;
}

export interface CartaoCreditoInput {
  banco: string;
  bandeira: BandeiraCartao;
  nome: string;
  diaFechamento: int;
  diaPagamento: int;
  limiteCentavos?: number;
}

export function cartaoChaveEstavel(c: CartaoCredito): string {
  const campoTamanho = (valor: string) => `${valor.length}:${valor}`;
  return `${campoTamanho(c.banco)}|${c.bandeira}|${campoTamanho(c.nome)}`;
}

// ---------------- Perfil do usuário ----------------

export type TemaCor = 'soft-pastel' | 'ocean-blue' | 'forest-green' | 'sunset-warm' | 'lavender-mist';

export interface UserProfile {
  id?: number;
  temaClaro: boolean;
  corFundo: number; // ARGB int
  temaCor: TemaCor; // tema de cor selecionado
  idioma: 'pt-BR' | 'en-US';
  username: string;
  avatar: string; // base64 string (ou URL/emoticon)
}

// ---------------- Segurança / PIN ----------------

export interface SegurancaConfig {
  id?: number;
  pinAtivo: boolean;
  pinHash?: string;
  bloqueioAtivo: boolean;
}

export interface TentativasBloqueio {
  contador: int;
  bloqueioAte?: string; // ISO
}

export interface ModeloIa {
  nome: string;
  caminho: string;
  tamanhoBytes: int;
}

// type helper para inteiros (Dart int)
type int = number;
