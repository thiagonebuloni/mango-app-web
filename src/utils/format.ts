// Utilitários de formatação de dinheiro e data (traduzidos do Dart → TypeScript)
import { format, parseISO } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import type { Category, PaymentMethod } from '../types/models';

export type Locale = 'pt-BR' | 'en-US';
type int = number;

const LOCALES: Record<Locale, object> = {
  'pt-BR': ptBR,
  'en-US': enUS,
};

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

export interface Parcela {
  estabelecimento: string;
  valorCentavos: int;
  data: string;
  parcelaAtual: int;
  totalParcelas: int;
  grupoParcela: string;
}

// ---------- Dinheiro ----------

export function formatMoney(valueCents: int, locale: Locale = 'pt-BR'): string {
  const value = valueCents / 100;
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: locale === 'pt-BR' ? 'BRL' : 'USD',
  }).format(value);
}

export function formatMoneyOf(valueCents: int, locale: Locale): string {
  return formatMoney(valueCents, locale);
}

// ---------- Data ----------

export function formatDateOf(
  isoDate: string,
  locale: Locale = 'pt-BR',
  formatFn?: (d: Date) => string,
): string {
  const d = parseISO(isoDate);
  if (formatFn) return formatFn(d);
  const loc = LOCALES[locale];
  return format(d, locale === 'en-US' ? 'MM/dd/yyyy' : 'dd/MM/yyyy', { locale: loc as any });
}

export function dayMonth(isoDate: string, locale: Locale = 'pt-BR'): string {
  const d = parseISO(isoDate);
  const loc = LOCALES[locale];
  return format(d, locale === 'en-US' ? 'MM/dd' : 'dd/MM', { locale: loc as any });
}

export function monthYear(isoDate: string, locale: Locale = 'pt-BR'): string {
  const d = parseISO(isoDate);
  const loc = LOCALES[locale];
  return format(d, locale === 'en-US' ? 'MMMM yyyy' : 'MMMM/yyyy', { locale: loc as any });
}

export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}

export function monthStartISO(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
}

// ---------- Parcelamento (x/y) ----------

export function expandirParcelas(base: ExpenseInput): Parcela[] {
  const estabelecimento = base.estabelecimento.trim();
  const match = estabelecimento.match(/^(.+?)\s*(\d+)\/(\d+)\s*$/);
  if (!match) {
    return [
      {
        estabelecimento: base.estabelecimento,
        valorCentavos: base.valorCentavos,
        data: base.data,
        parcelaAtual: 1,
        totalParcelas: 1,
        grupoParcela: grupoParcelaDe(base.estabelecimento),
      },
    ];
  }

  const nome = match[1].trim();
  const parcelaAtual = parseInt(match[2], 10);
  const totalParcelas = parseInt(match[3], 10);
  const grupoParcela = grupoParcelaDe(nome);

  const dataBase = parseISO(base.data);
  const parcelas: Parcela[] = [];
  const valorParcela = Math.round(base.valorCentavos / totalParcelas);

  for (let i = parcelaAtual; i <= totalParcelas; i++) {
    const d = new Date(Date.UTC(dataBase.getFullYear(), dataBase.getMonth() + (i - parcelaAtual), 1));
    parcelas.push({
      estabelecimento: `${nome} ${i}/${totalParcelas}`,
      valorCentavos:
        i === totalParcelas
          ? base.valorCentavos - valorParcela * (totalParcelas - parcelaAtual)
          : valorParcela,
      data: d.toISOString().split('T')[0],
      parcelaAtual: i,
      totalParcelas,
      grupoParcela,
    });
  }
  return parcelas;
}

function grupoParcelaDe(estabelecimento: string): string {
  return estabelecimento.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}
