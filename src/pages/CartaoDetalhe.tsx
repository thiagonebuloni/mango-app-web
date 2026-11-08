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

  const { despesas, meses, definirMesCartoes } = useMangoStore();
  const mesCartoes = meses.cartoes;

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

  const diaMax = Math.max(
    1,
    ...Object.keys(groupByDay).map((d) => Number(d)),
    1,
  );

  const irParaAtual = (): void => {
    const hoje = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    definirMesCartoes(hoje);
  };

  if (cartaoId == null) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-gray-400">{t('Cartão não informado.')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/cartoes')}
              aria-label={t('Voltar')}
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--tema-text-secondary)] transition hover:bg-[var(--tema-surface-elevado)] hover:text-[var(--tema-text-primary)]"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">{cartaoId}</h1>
              <p className="text-gray-400 text-sm">
                {monthYear(`${mesCartoes}-01`, idioma)}
              </p>
            </div>
          </div>
          <button
            onClick={irParaAtual}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm"
          >
            {t('Mês atual')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="rounded-xl border border-gray-800 bg-gray-900/40 p-4">
            <div className="text-sm text-gray-400">{t('Total gasto')}</div>
            <div className="text-xl font-bold text-white">
              {formatMoney(total, idioma)}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <h2 className="text-lg font-semibold mb-4">{t('Por categoria')}</h2>
            <div className="space-y-4">
              {CATEGORY_DESPESAS.map((cat) => {
                const valor = groupByCategory[cat] ?? 0;
                const pct = total > 0 ? (valor / total) * 100 : 0;
                return (
                  <div key={cat}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-300">{t(CATEGORY_LABELS[cat])}</span>
                      <span className="text-gray-400">{formatMoney(valor, idioma)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
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

          <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
            <h2 className="text-lg font-semibold mb-4">{t('Por dia')}</h2>
            <div className="space-y-4">
              {Object.keys(groupByDay)
                .sort((a, b) => a.localeCompare(b))
                .map((dia) => {
                  const valor = groupByDay[dia];
                  const pct = (valor / diaMax) * 100;
                  return (
                    <div key={dia}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-300">{formatDateOf(dia, idioma)}</span>
                        <span className="text-gray-400">{formatMoney(valor, idioma)}</span>
                      </div>
                      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-green-600"
                          style={{ width: `${Math.max(4, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              {Object.keys(groupByDay).length === 0 && (
                <div className="text-center py-8 text-gray-500">
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
