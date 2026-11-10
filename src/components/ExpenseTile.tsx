import { ChevronRight, Trash2 } from 'lucide-react';
import type { Expense } from '../types/models';
import { formatMoney, dayMonth } from '../utils/format';
import { useI18n } from '../utils/i18n';
import { CATEGORY_LABELS, PAYMENT_METHOD_LABELS, categoryIsReceita } from '../types/models';

interface ExpenseTileProps {
  expense: Expense;
  onTap: () => void;
  onDelete: () => void;
}

export function ExpenseTile({ expense, onTap, onDelete }: ExpenseTileProps) {
  const { idioma, t } = useI18n();
  const isReceita = categoryIsReceita(expense.categoria);

  return (
    <div className="flex w-full min-w-0 items-stretch gap-2 rounded-lg border border-gray-700 bg-gray-800/50 p-2 transition-colors hover:bg-gray-800">
      <button
        type="button"
        onClick={onTap}
        className="flex min-w-0 flex-1 items-center justify-between gap-3 rounded-md p-1 text-left"
      >
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                isReceita ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {t(CATEGORY_LABELS[expense.categoria])}
            </span>
            {expense.parcelado && (
              <span className="rounded bg-gray-700 px-1.5 py-0.5 text-[10px] text-gray-300">
                {expense.parcelaAtual}/{expense.totalParcelas}
              </span>
            )}
          </div>
          <div className="truncate text-sm font-medium text-foreground">
            {expense.estabelecimento}
          </div>
          <div className="mt-0.5 text-xs text-gray-400">
            {dayMonth(expense.data, idioma)}
            {!isReceita && ` • ${t(PAYMENT_METHOD_LABELS[expense.formaPagamento])}`}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className={`whitespace-nowrap font-bold ${isReceita ? 'text-green-400' : 'text-red-400'}`}>
            {isReceita ? '+' : '-'}{formatMoney(expense.valorCentavos, idioma)}
          </div>
          <ChevronRight className="ml-auto mt-1 h-3 w-3 text-gray-500" />
        </div>
      </button>
      <button
        type="button"
        onClick={onDelete}
        aria-label={`${t('Excluir lançamento')}: ${expense.estabelecimento}`}
        className="grid w-11 shrink-0 place-items-center self-center rounded-xl text-gray-400 transition hover:bg-rose-500/10 hover:text-rose-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400"
      >
        <Trash2 className="h-5 w-5" />
      </button>
    </div>
  );
}
