import {
  Banknote,
  BriefcaseBusiness,
  CarFront,
  Clapperboard,
  HeartPulse,
  House,
  Shirt,
  ShoppingCart,
  Sparkles,
  Utensils,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import type { Category, Expense } from '../types/models';
import { formatMoney, dayMonth } from '../utils/format';
import { useI18n } from '../utils/i18n';
import { CATEGORY_LABELS, categoryIsReceita } from '../types/models';

interface ExpenseTileProps {
  expense: Expense;
  onTap: () => void;
  onDelete: () => void;
}

const CATEGORY_APPEARANCE: Record<Category, { icon: LucideIcon; color: string; background: string }> = {
  alimentacao: { icon: Utensils, color: '#b66b2b', background: '#f5e4d4' },
  transporte: { icon: CarFront, color: '#3783d6', background: '#dceafa' },
  mercado: { icon: ShoppingCart, color: '#15986e', background: '#d7f0e5' },
  vestuario: { icon: Shirt, color: '#af648d', background: '#f3e0eb' },
  saude: { icon: HeartPulse, color: '#df626d', background: '#f7dfe1' },
  lazer: { icon: Clapperboard, color: '#8b65b5', background: '#ebe2f5' },
  moradia: { icon: House, color: '#3295d0', background: '#dcecf6' },
  outros: { icon: Sparkles, color: '#777984', background: '#e4e4eb' },
  salario: { icon: Banknote, color: '#29905b', background: '#d9eee1' },
  investimentos: { icon: BriefcaseBusiness, color: '#398d83', background: '#d9eeea' },
  bonificacao: { icon: Sparkles, color: '#a27a23', background: '#f4ebd0' },
  freelance: { icon: Wallet, color: '#6d7fc3', background: '#e3e7f7' },
  rendaExtra: { icon: Wallet, color: '#6d7fc3', background: '#e3e7f7' },
  aluguel: { icon: House, color: '#3295d0', background: '#dcecf6' },
  pensao: { icon: Banknote, color: '#29905b', background: '#d9eee1' },
};

export function ExpenseTile({ expense, onTap, onDelete }: ExpenseTileProps) {
  const { idioma, t } = useI18n();
  const isReceita = categoryIsReceita(expense.categoria);
  const appearance = CATEGORY_APPEARANCE[expense.categoria];
  const Icon = appearance.icon;

  return (
    <article className="group flex min-w-0 items-center gap-3 border-b border-[var(--tema-border)]/55 py-2.5 sm:gap-4 sm:py-3">
      <span
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full sm:h-11 sm:w-11"
        style={{
          color: appearance.color,
          backgroundColor: `color-mix(in srgb, ${appearance.background} 78%, var(--tema-surface))`,
        }}
        aria-hidden="true"
      >
        <Icon className="h-[1.15rem] w-[1.15rem]" strokeWidth={2.2} />
      </span>
      <button
        type="button"
        onClick={onTap}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[15px] font-medium leading-5 text-[var(--tema-text-primary)]">
            {expense.estabelecimento}
          </span>
          <span className="mt-0.5 block truncate text-[13px] leading-4 text-[var(--tema-text-secondary)]">
            {dayMonth(expense.data, idioma)} <span aria-hidden="true">·</span> {t(CATEGORY_LABELS[expense.categoria])}
          </span>
        </span>
        {expense.parcelado && (
          <span className="shrink-0 rounded-full bg-[var(--tema-accent)]/10 px-2 py-0.5 text-[11px] font-semibold leading-4 text-[var(--tema-accent)]">
            {expense.parcelaAtual}/{expense.totalParcelas}
          </span>
        )}
      </button>
      <span className={`shrink-0 whitespace-nowrap text-right text-sm font-bold tabular-nums ${isReceita ? 'text-emerald-700 dark:text-emerald-300' : 'text-[var(--tema-text-primary)]'}`}>
        {isReceita ? '+' : ''}{formatMoney(expense.valorCentavos, idioma)}
      </span>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`${t('Excluir lançamento')}: ${expense.estabelecimento}`}
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[var(--tema-text-secondary)] opacity-35 transition hover:bg-rose-500/10 hover:text-rose-600 hover:opacity-100 focus-visible:opacity-100 sm:opacity-0 sm:group-hover:opacity-70"
      >
        <span className="sr-only">{t('Excluir lançamento')}</span>
        <span aria-hidden="true" className="text-xl leading-none">×</span>
      </button>
    </article>
  );
}
