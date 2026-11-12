import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useMangoStore } from '../store/useStore';
import { CATEGORY_DESPESAS, CATEGORY_LABELS } from '../types/models';
import { formatMoney, monthYear, formatDateOf } from '../utils/format';
import { useI18n } from '../utils/i18n';

export function CartaoDetalhe() {
  const { idioma, t } = useI18n();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const cartaoId = id ? Number(id) : undefined;

  const { despesas, cartoes, meses, definirMesCartoes } = useMangoStore();
  const mesCartoes = meses.cartoes;
  const cartao = cartoes.find((item) => item.id === cartaoId);

  const despesasMes = useMemo(() => {
    return despesas.filter((e) => e.data.startsWith(mesCartoes));
  }, [despesas, mesCartoes]);

  const despesasDoCartao = useMemo(() => {
    if (!cartaoId) return [];
    return despesasMes.filter((e) => e.cartaoId === cartaoId);
  }, [despesasMes, cartaoId]);

  const total = useMemo(() => {
    return despesasDoCartao.reduce((acc, e) => acc + e.valorCentavos, 0);
  }, [despesasDoCartao]);

  const groupByCategory = useMemo(() => {
    const groups: Record<string, number> = {};
    CATEGORY_DESPESAS.forEach((c) => {
      groups[c] = 0;
    });
    despesasDoCartao.forEach((e) => {
      if (groups[e.categoria] !== undefined) {
        groups[e.categoria] += e.valorCentavos;
      }
    });
    return groups;
  }, [despesasDoCartao]);

  const groupByDay = useMemo(() => {
    const groups: Record<string, number> = {};
    despesasDoCartao.forEach((e) => {
      groups[e.data] = (groups[e.data] ?? 0) + e.valorCentavos;
    });
    return groups;
  }, [despesasDoCartao]);

  const diaMax = Math.max(1, ...Object.values(groupByDay));

  const irParaAtual = (): void => {
    const hoje = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    definirMesCartoes(hoje);
  };

  if (cartaoId == null) {
    return (
      <div className="min-h-screen bg-background p-4 text-foreground sm:p-6">
        <div className="mx-auto max-w-2xl rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-6 text-center">
          <p className="text-[var(--tema-text-secondary)]">{t('Cartão não informado.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background px-4 pb-28 pt-5 text-foreground sm:px-6 sm:py-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/cartoes')}
              aria-label={t('Voltar')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--tema-text-secondary)] transition hover:bg-[var(--tema-surface-elevado)] hover:text-[var(--tema-text-primary)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="min-w-0">
              <h1 className="truncate text-2xl font-bold tracking-tight text-[var(--tema-text-primary)]">
                {cartao?.nome ?? t('Cartão')}
              </h1>
              <p className="mt-0.5 text-sm capitalize text-[var(--tema-text-secondary)]">
                {cartao ? `${cartao.banco} · ` : ''}{monthYear(`${mesCartoes}-01`, idioma)}
              </p>
            </div>
          </div>
          <button
            onClick={irParaAtual}
            className="self-start rounded-xl border border-[var(--tema-border)] bg-[var(--tema-surface)] px-4 py-2.5 text-sm font-medium text-[var(--tema-text-primary)] transition hover:bg-[var(--tema-surface-elevado)] sm:self-auto"
          >
            {t('Mês atual')}
          </button>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 shadow-sm">
            <div className="text-sm font-medium text-[var(--tema-text-secondary)]">{t('Total gasto')}</div>
            <div className="mt-1 text-2xl font-bold tracking-tight text-[var(--tema-text-primary)]">
              {formatMoney(total, idioma)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:gap-6">
          <section className="rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-[var(--tema-text-primary)]">{t('Por categoria')}</h2>
            <div className="space-y-4">
              {CATEGORY_DESPESAS.map((cat) => {
                const valor = groupByCategory[cat] ?? 0;
                const pct = total > 0 ? (valor / total) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                      <span className="truncate text-[var(--tema-text-primary)]">{t(CATEGORY_LABELS[cat])}</span>
                      <span className="shrink-0 text-[var(--tema-text-secondary)]">{formatMoney(valor, idioma)}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-[var(--tema-surface-elevado)]">
                      <div
                        className="h-full rounded-full bg-[var(--tema-accent)]"
                        style={{ width: `${Math.max(0, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 shadow-sm sm:p-6">
            <h2 className="mb-5 text-lg font-semibold text-[var(--tema-text-primary)]">{t('Por dia')}</h2>
            <div className="space-y-4">
              {Object.keys(groupByDay)
                .sort((a, b) => a.localeCompare(b))
                .map((dia) => {
                  const valor = groupByDay[dia];
                  const pct = (valor / diaMax) * 100;
                  return (
                    <div key={dia}>
                      <div className="mb-1.5 flex items-center justify-between gap-3 text-sm">
                          <span className="text-[var(--tema-text-primary)]">{formatDateOf(dia, idioma)}</span>
                          <span className="shrink-0 text-[var(--tema-text-secondary)]">{formatMoney(valor, idioma)}</span>
                      </div>
                        <div className="h-2 overflow-hidden rounded-full bg-[var(--tema-surface-elevado)]">
                        <div
                            className="h-full rounded-full bg-[var(--tema-accent)]"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(groupByDay).length === 0 && (
                <div className="py-8 text-center text-sm text-[var(--tema-text-secondary)]">
                  {t('Nenhum gasto registrado para este cartão neste mês.')}
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

export default CartaoDetalhe;
