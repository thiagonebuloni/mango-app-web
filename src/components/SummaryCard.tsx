import { formatMoney } from '../utils/format';
import { useI18n } from '../utils/i18n';

interface SummaryCardProps {
  label: string;
  value: number; // centavos
  selected: boolean;
  corDestaque?: string;
  onTap: () => void;
}

export function SummaryCard({
  label,
  value,
  selected,
  corDestaque,
  onTap,
}: SummaryCardProps) {
  const { idioma, t } = useI18n();
  const fundoCaixa = corDestaque ?? (selected
    ? 'var(--tema-accent)'
    : 'color-mix(in srgb, var(--tema-surface-elevado) 82%, transparent)');

  return (
    <button
      onClick={onTap}
      className="min-w-0 flex-1 rounded-2xl border px-3 py-4 text-left transition-all duration-200 hover:-translate-y-0.5 sm:px-5 sm:py-5"
      aria-pressed={selected}
      style={{
        backgroundColor: fundoCaixa ?? 'transparent',
        borderColor: selected ? 'color-mix(in srgb, var(--tema-accent) 70%, white)' : 'rgba(255,255,255,0.08)',
        color: selected || corDestaque ? '#fff' : 'var(--tema-text-primary)',
        boxShadow: selected ? '0 10px 28px color-mix(in srgb, var(--tema-accent) 18%, transparent)' : undefined,
      }}
    >
      <span className={`block truncate text-xs sm:text-sm ${selected || corDestaque ? 'text-white/75' : 'text-[var(--tema-text-secondary)]'}`}>{t(label)}</span>
      <span className="mt-2 block truncate text-base font-bold tracking-tight sm:text-xl">{formatMoney(value, idioma)}</span>
    </button>
  );
}
