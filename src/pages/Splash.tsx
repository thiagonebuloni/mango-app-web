import { ReceiptIcon, CreditCard, PieChart } from 'lucide-react';
import { useI18n } from '../utils/i18n';

export function Splash() {
  const { t } = useI18n();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[var(--tema-accent)]/20 border border-[var(--tema-accent)]/30 mb-6">
          <ReceiptIcon className="w-10 h-10 text-[var(--tema-accent)]" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Mango</h1>
        <p className="mt-2 text-gray-400 text-sm">
          {t('Controle de gastos com leitura de cupom fiscal')}
        </p>
      </div>

      <div className="mt-12 flex gap-4">
        <div className="flex flex-col items-center">
          <ReceiptIcon className="w-6 h-6 text-gray-500 mb-2" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {t('Gastos')}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <CreditCard className="w-6 h-6 text-gray-500 mb-2" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {t('Cartões')}
          </span>
        </div>
        <div className="flex flex-col items-center">
          <PieChart className="w-6 h-6 text-gray-500 mb-2" />
          <span className="text-xs text-gray-500 uppercase tracking-wider">
            {t('Relatórios')}
          </span>
        </div>
      </div>

      <div className="mt-10 animate-pulse text-xs text-gray-600">
        {t('Carregando…')}
      </div>
    </div>
  );
}

export default Splash;
