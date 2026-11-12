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
  const fundoCaixa = corDestaque ?? `color-mix(in srgb, var(--tema-accent) ${selected ? '12%' : '5%'}, var(--tema-surface))`;

  return (
    <button
      onClick={onTap}
      className="min-w-0 flex-1 rounded-xl border px-2 py-2.5 text-center transition-all duration-200 hover:-translate-y-0.5 sm:rounded-2xl sm:px-5 sm:py-4"
      aria-pressed={selected}
      style={{
        backgroundColor: fundoCaixa ?? 'transparent',
        borderColor: selected ? 'color-mix(in srgb, var(--tema-accent) 48%, var(--tema-border))' : 'var(--tema-border)',
        color: corDestaque ? '#fff' : 'var(--tema-text-primary)',
        boxShadow: selected ? '0 3px 8px color-mix(in srgb, var(--tema-accent) 10%, transparent)' : '0 2px 3px rgba(0,0,0,.04)',
      }}
    >
      <span className={`block truncate text-[11px] leading-4 sm:text-sm ${corDestaque ? 'text-white/75' : 'text-[var(--tema-text-secondary)]'}`}>{t(label)}</span>
      <span className="mt-0.5 block truncate text-sm font-bold tracking-tight sm:text-lg">{formatMoney(value, idioma)}</span>
    </button>
  );
}
