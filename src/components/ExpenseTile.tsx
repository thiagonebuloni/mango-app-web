import { ChevronRight } from 'lucide-react';
import type { Expense } from '../types/models';
import { formatMoney, dayMonth } from '../utils/format';
import { useI18n } from '../utils/i18n';
import { CATEGORY_LABELS, PAYMENT_METHOD_LABELS, categoryIsReceita } from '../types/models';

interface ExpenseTileProps {
  expense: Expense;
  onTap: () => void;
}

export function ExpenseTile({ expense, onTap }: ExpenseTileProps) {
  const { idioma, t } = useI18n();
  const isReceita = categoryIsReceita(expense.categoria);

  return (
    <button
      onClick={onTap}
      className="flex w-full min-w-0 items-center justify-between gap-3 rounded-lg border border-gray-700 bg-gray-800/50 p-3 transition-colors hover:bg-gray-800"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-semibold uppercase tracking-wider ${
              isReceita ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {t(CATEGORY_LABELS[expense.categoria])}
          </span>
          {expense.parcelado && (
            <span className="text-[10px] bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
              {expense.parcelaAtual}/{expense.totalParcelas}
            </span>
          )}
        </div>
        <div className="text-sm font-medium text-foreground truncate">
          {expense.estabelecimento}
        </div>
        <div className="text-xs text-gray-400 mt-0.5">
          {dayMonth(expense.data, idioma)}
          {!isReceita && ` • ${t(PAYMENT_METHOD_LABELS[expense.formaPagamento])}`}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className={`whitespace-nowrap font-bold ${isReceita ? 'text-green-400' : 'text-red-400'}`}>
          {isReceita ? '+' : '-'}{formatMoney(expense.valorCentavos, idioma)}
        </div>
        <ChevronRight className="ml-2 w-3 h-3 text-gray-500" />
      </div>
    </button>
  );
}
