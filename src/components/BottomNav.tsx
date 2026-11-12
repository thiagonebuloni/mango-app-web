import { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ReceiptText, ChartNoAxesCombined, CreditCard, Menu } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import { SidebarMenuContext } from './SidebarMenuContext';

const TABS = [
  { label: 'Gastos', to: '/', icon: ReceiptText },
  { label: 'Relatórios', to: '/relatorios', icon: ChartNoAxesCombined },
  { label: 'Cartões', to: '/cartoes', icon: CreditCard },
];

export function BottomNav() {
  const location = useLocation();
  const { t } = useI18n();
  const openMenu = useContext(SidebarMenuContext);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-[var(--tema-border)]/60 bg-[var(--tema-surface)]/95 px-2 pb-[calc(.3rem+env(safe-area-inset-bottom))] pt-1.5 backdrop-blur-xl sm:inset-x-5 sm:bottom-5 sm:mx-auto sm:max-w-xl sm:rounded-2xl sm:border sm:px-4 sm:py-2 sm:shadow-xl">
      <div className="mx-auto flex max-w-md items-center justify-around sm:max-w-xl">
        {TABS.map((tab) => {
          const ativo = location.pathname === tab.to;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.to}
              to={tab.to}
              aria-current={ativo ? 'page' : undefined}
              className={`flex min-w-[4rem] flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] transition-all sm:min-w-0 sm:flex-row sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm ${
                ativo ? 'bg-[var(--tema-accent)]/10 text-[var(--tema-accent)]' : 'text-[var(--tema-text-secondary)] hover:bg-[var(--tema-surface-elevado)]'
              }`}
            >
              <Icon className="h-5 w-5 sm:h-4 sm:w-4" strokeWidth={ativo ? 2.5 : 1.8} />
              <span className={ativo ? 'font-semibold' : 'font-medium'}>{t(tab.label)}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => openMenu?.()}
          aria-label={t('Abrir menu')}
          className="flex min-w-[4rem] flex-col items-center gap-0.5 rounded-xl px-3 py-1 text-[11px] text-[var(--tema-text-secondary)] transition hover:bg-[var(--tema-surface-elevado)] sm:min-w-0 sm:flex-row sm:gap-2 sm:px-6 sm:py-2.5 sm:text-sm"
        >
          <Menu className="h-5 w-5 sm:h-4 sm:w-4" />
          <span className="font-medium">{t('Menu')}</span>
        </button>
      </div>
    </nav>
  );
}

export default BottomNav;
