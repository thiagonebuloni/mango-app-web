import { Link, useLocation } from 'react-router-dom';
import { ReceiptText, ChartNoAxesCombined, CreditCard } from 'lucide-react';
import { useI18n } from '../utils/i18n';

const TABS = [
  { label: 'Gastos', to: '/', icon: ReceiptText },
  { label: 'Relatórios', to: '/relatorios', icon: ChartNoAxesCombined },
  { label: 'Cartões', to: '/cartoes', icon: CreditCard },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useI18n();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 px-3 pb-[calc(.6rem+env(safe-area-inset-bottom))] pt-2 sm:bottom-5 sm:px-6 sm:pb-0">
      <div className="mx-auto flex max-w-md items-center justify-around rounded-[1.4rem] border border-white/[0.08] bg-[#111312]/95 px-2 py-2 shadow-[0_12px_42px_rgba(0,0,0,.4)] backdrop-blur-xl sm:max-w-xl sm:px-4 sm:py-3">
        {TABS.map((tab) => {
          const ativo = location.pathname === tab.to;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={ativo ? 'page' : undefined}
              className={`flex min-w-[5.5rem] flex-col items-center gap-1 rounded-full px-4 py-2 text-[11px] transition-all sm:min-w-0 sm:flex-row sm:gap-2 sm:px-6 sm:py-3 sm:text-sm ${
                ativo ? 'bg-[var(--tema-accent)]/20 text-[var(--tema-accent)]' : 'text-stone-400 hover:text-stone-100'
              }`}
            >
              <Icon className="h-5 w-5 sm:h-4 sm:w-4" strokeWidth={ativo ? 2.5 : 1.8} />
              <span className={ativo ? 'font-semibold' : 'font-medium'}>{t(tab.label)}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

export default BottomNav;
