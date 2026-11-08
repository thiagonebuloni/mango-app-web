import { useMemo, useState } from 'react';
import { useMangoStore } from '../store/useStore';
import {
  CATEGORY_DESPESAS,
  CATEGORY_RECEITAS,
  CATEGORY_LABELS,
} from '../types/models';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { formatMoney, monthYear, dayMonth } from '../utils/format';
import { BottomNav } from '../components/BottomNav';
import { useI18n } from '../utils/i18n';
import { localAiService } from '../services/local-ai';
import { PAYMENT_METHOD_LABELS, type PaymentMethod } from '../types/models';

type Periodo = 'month' | '30days' | 'year' | 'custom';

const CORES_GRAFICO = ['#f05252', '#0ea5e9', '#10b981', '#3b82f6', '#f59e0b', '#a78bfa', '#f472b6', '#94a3b8'];

function dataISO(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function dataLegivel(isoDate: string, idioma: string): string {
  return new Date(`${isoDate}T12:00:00`).toLocaleDateString(idioma, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function moverDataISO(isoDate: string, dias: number): string {
  const data = new Date(`${isoDate}T12:00:00`);
  data.setDate(data.getDate() + dias);
  return dataISO(data);
}

export function Relatorios() {
  const { idioma, t } = useI18n();
  const { despesas, meses, definirMesGastos } = useMangoStore();
  const [relatorioSimulado, setRelatorioSimulado] = useState<string | null>(null);
  const [erroRelatorio, setErroRelatorio] = useState<string | null>(null);
  const [gerandoRelatorio, setGerandoRelatorio] = useState(false);
  const mesAtual = meses.gastos;
  const [periodo, setPeriodo] = useState<Periodo>('month');
  const [periodoOffset, setPeriodoOffset] = useState(0);
  const [inicioCustom, setInicioCustom] = useState(`${mesAtual}-01`);
  const [fimCustom, setFimCustom] = useState(dataISO(new Date()));
  const hoje = new Date();
  const inicioTrintaDias = new Date(hoje);
  inicioTrintaDias.setDate(hoje.getDate() - 29 + periodoOffset * 30);
  const [inicioMes] = mesAtual.split('-');
  const inicioPeriodo = periodo === 'month'
    ? `${mesAtual}-01`
    : periodo === '30days'
      ? dataISO(inicioTrintaDias)
      : periodo === 'year'
        ? `${hoje.getFullYear() + periodoOffset}-01-01`
        : inicioCustom;
  const fimPeriodo = periodo === 'month'
    ? dataISO(new Date(Number(inicioMes), Number(mesAtual.split('-')[1]), 0))
    : periodo === '30days'
      ? moverDataISO(dataISO(hoje), periodoOffset * 30)
      : periodo === 'year'
        ? periodoOffset === 0
          ? dataISO(hoje)
          : `${hoje.getFullYear() + periodoOffset}-12-31`
      : fimCustom;
  const despesasPeriodo = useMemo(
    () => despesas.filter((e) => e.data >= inicioPeriodo && e.data <= fimPeriodo),
    [despesas, inicioPeriodo, fimPeriodo],
  );

  const totalDespesas = useMemo(() => {
    return despesasPeriodo
      .filter((e) => !CATEGORY_RECEITAS.includes(e.categoria))
      .reduce((acc, e) => acc + e.valorCentavos, 0);
  }, [despesasPeriodo]);

  const totalReceitas = useMemo(() => {
    return despesasPeriodo
      .filter((e) => CATEGORY_RECEITAS.includes(e.categoria))
      .reduce((acc, e) => acc + e.valorCentavos, 0);
  }, [despesasPeriodo]);

  const groupByCategory = useMemo(() => {
    const groups: Record<string, number> = {};
    CATEGORY_DESPESAS.forEach((c) => {
      groups[c] = 0;
    });
    despesasPeriodo.forEach((e) => {
      if (!CATEGORY_RECEITAS.includes(e.categoria) && groups[e.categoria] !== undefined) {
        groups[e.categoria] += e.valorCentavos;
      }
    });
    return groups;
  }, [despesasPeriodo]);

  const groupByDay = useMemo(() => {
    const groups: Record<string, number> = {};
    despesasPeriodo.forEach((e) => {
      if (CATEGORY_RECEITAS.includes(e.categoria)) return;
      groups[e.data] = (groups[e.data] ?? 0) + e.valorCentavos;
    });
    return groups;
  }, [despesasPeriodo]);

  const gruposPagamento = useMemo(() => {
    const groups: Partial<Record<PaymentMethod, number>> = {};
    despesasPeriodo.forEach((entry) => {
      if (CATEGORY_RECEITAS.includes(entry.categoria)) return;
      groups[entry.formaPagamento] = (groups[entry.formaPagamento] ?? 0) + entry.valorCentavos;
    });
    return groups;
  }, [despesasPeriodo]);

  const categoriasComGasto = CATEGORY_DESPESAS
    .map((categoria, index) => ({
      categoria,
      valor: groupByCategory[categoria] ?? 0,
      cor: CORES_GRAFICO[index % CORES_GRAFICO.length],
    }))
    .filter((item) => item.valor > 0)
    .sort((a, b) => b.valor - a.valor);
  let acumuladoDonut = 0;
  const gradienteDonut = categoriasComGasto.length
    ? `conic-gradient(${categoriasComGasto.map((item) => {
        const inicio = acumuladoDonut;
        acumuladoDonut += (item.valor / (totalDespesas || 1)) * 100;
        return `${item.cor} ${inicio}% ${acumuladoDonut}%`;
      }).join(', ')})`
    : 'conic-gradient(#343837 0% 100%)';

  const diaMax = Math.max(1, ...Object.values(groupByDay));

  const mudarMes = (delta: number) => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const novaData = new Date(ano, mes - 1 + delta, 1);
    definirMesGastos(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`);
    setPeriodo('month');
  };

  const mudarPeriodo = (delta: number): void => {
    if (periodo === 'month') {
      mudarMes(delta);
      return;
    }
    if (periodo === 'custom') return;
    setPeriodoOffset((offset) => offset + delta);
  };

  const gerarRelatorioSimulado = async () => {
    setErroRelatorio(null);
    setGerandoRelatorio(true);
    try {
      const maiorCategoria = CATEGORY_DESPESAS
        .map((categoria) => ({
          name: t(CATEGORY_LABELS[categoria]),
          cents: groupByCategory[categoria] ?? 0,
        }))
        .filter((categoria) => categoria.cents > 0)
        .sort((a, b) => b.cents - a.cents)[0];
      const resultado = await localAiService.generateReport({
        locale: idioma,
        periodLabel: `${dataLegivel(inicioPeriodo, idioma)} – ${dataLegivel(fimPeriodo, idioma)}`,
        expensesCents: totalDespesas,
        incomeCents: totalReceitas,
        entryCount: despesasPeriodo.length,
        leadingCategory: maiorCategoria,
      });
      setRelatorioSimulado(resultado.text);
    } catch (error) {
      setErroRelatorio(
        error instanceof Error ? error.message : String(error),
      );
    } finally {
      setGerandoRelatorio(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 pb-32 pt-5 text-foreground sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto mb-6 max-w-4xl overflow-hidden rounded-2xl border border-white/[0.08] bg-[#131514] lg:mb-8">
          <div className="grid grid-cols-4">
            {([
              ['month', 'Mês'],
              ['30days', 'Últimos 30 dias'],
              ['year', 'Ano'],
              ['custom', 'Personalizado'],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setPeriodo(value);
                  setPeriodoOffset(0);
                }}
                aria-pressed={periodo === value}
                className={`min-h-12 border-r border-white/[0.07] px-1.5 text-[11px] leading-tight transition last:border-r-0 sm:px-3 sm:text-sm ${
                  periodo === value
                    ? 'bg-[var(--tema-accent)] font-semibold text-white'
                    : 'text-stone-400 hover:bg-white/[0.04] hover:text-stone-100'
                }`}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        {periodo === 'custom' ? (
          <div className="mx-auto mb-5 grid max-w-4xl grid-cols-2 gap-4 lg:mb-7">
            <label className="text-xs text-stone-400">
              {t('De')}
              <input
                type="date"
                value={inicioCustom}
                max={fimCustom}
                onChange={(event) => setInicioCustom(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#151716] px-3 py-2.5 text-sm text-white"
              />
            </label>
            <label className="text-xs text-stone-400">
              {t('Até')}
              <input
                type="date"
                value={fimCustom}
                min={inicioCustom}
                onChange={(event) => setFimCustom(event.target.value)}
                className="mt-1 w-full rounded-xl border border-white/10 bg-[#151716] px-3 py-2.5 text-sm text-white"
              />
            </label>
          </div>
        ) : (
          <div className="mx-auto mb-6 flex max-w-4xl items-center justify-between px-1 lg:mb-8">
            <button
              onClick={() => mudarPeriodo(-1)}
              className="grid h-10 w-10 place-items-center rounded-full text-stone-400 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={t('Período anterior')}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="text-center">
              <p className="font-semibold capitalize text-stone-100">
                {periodo === 'month'
                  ? monthYear(`${mesAtual}-01`, idioma)
                  : periodo === 'year'
                    ? inicioPeriodo.slice(0, 4)
                    : t('Últimos 30 dias')}
              </p>
              <p className="mt-1 text-sm text-stone-400">
                {dataLegivel(inicioPeriodo, idioma)} — {dataLegivel(fimPeriodo, idioma)}
              </p>
            </div>
            <button
              onClick={() => mudarPeriodo(1)}
              className="grid h-10 w-10 place-items-center rounded-full text-stone-400 transition hover:bg-white/[0.06] hover:text-white"
              aria-label={t('Próximo período')}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
        )}

        <button
          onClick={gerarRelatorioSimulado}
          disabled={gerandoRelatorio}
          className="mx-auto mb-7 flex min-h-14 w-full max-w-4xl items-center justify-center gap-3 rounded-2xl bg-[var(--tema-accent)] px-4 text-center text-sm font-semibold text-white shadow-[0_8px_24px_color-mix(in_srgb,var(--tema-accent)_24%,transparent)] transition hover:brightness-110 disabled:opacity-60 sm:text-base lg:mb-8"
        >
          <Sparkles className="h-5 w-5" />
          {gerandoRelatorio ? t('Gerando…') : t('Gerar relatório mensal por I.A.')}
        </button>

        {(erroRelatorio || relatorioSimulado) && (
          <section className="mx-auto mb-6 max-w-4xl rounded-2xl border border-white/[0.08] bg-[var(--tema-surface)] p-4">
            <p className="text-sm text-stone-300">
              {erroRelatorio ?? t('Resumo simulado; nenhum modelo de IA é executado.')}
            </p>
            {relatorioSimulado && (
              <pre className="mt-3 whitespace-pre-wrap text-xs leading-relaxed text-stone-400">{relatorioSimulado}</pre>
            )}
          </section>
        )}

        <section className="mb-6 rounded-[1.7rem] border border-white/[0.06] bg-[color-mix(in_srgb,var(--tema-accent)_62%,#21180f)] p-6 shadow-[0_16px_38px_rgba(0,0,0,.18)] sm:p-8 lg:mb-8 lg:p-10">
          <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr] lg:items-center lg:gap-10">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-white lg:text-2xl">{t('Despesas x Receitas')}</h2>
              <p className="mt-1 text-sm text-white/65">{t('Total do período')}</p>
              <div className="mt-5 lg:mt-8">
                <p className="text-sm text-white/65">{t('Saldo')}</p>
                <p className={`mt-1 text-3xl font-extrabold tracking-tight lg:text-4xl ${totalReceitas - totalDespesas < 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {totalReceitas - totalDespesas < 0 ? '− ' : ''}{formatMoney(Math.abs(totalReceitas - totalDespesas), idioma)}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-5 lg:gap-8">
              {[
                { label: 'Despesas', total: totalDespesas, cor: '#f05252', icone: '−' },
                { label: 'Receitas', total: totalReceitas, cor: '#22c55e', icone: '+' },
              ].map(({ label, total, cor, icone }) => (
                <div key={label} className="flex flex-col items-center">
                  <div className="flex h-36 w-full max-w-40 items-end justify-center sm:h-48 lg:h-56">
                    <div
                      className="w-14 rounded-t-xl transition-all sm:w-20"
                      style={{
                        height: `${Math.max(3, (total / Math.max(totalDespesas, totalReceitas, 1)) * 100)}%`,
                        backgroundColor: cor,
                      }}
                    />
                  </div>
                  <span className="mt-3 text-sm text-white/75">{t(label)}</span>
                  <span className="mt-1 text-center text-sm font-bold text-white">{icone} {formatMoney(total, idioma)}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 2xl:gap-6">
          <section className="min-w-0 overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-[color-mix(in_srgb,var(--tema-accent)_62%,#21180f)] p-4 sm:p-5">
            <h2 className="text-lg font-bold text-white">{t('Gastos por dia')}</h2>
            <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
              {Object.keys(groupByDay)
                .sort((a, b) => b.localeCompare(a))
                .map((dia) => {
                  const valor = groupByDay[dia];
                  const pct = (valor / diaMax) * 100;
                  const weekday = new Date(`${dia}T12:00:00`).toLocaleDateString(idioma, { weekday: 'short' });
                  const quantidade = despesasPeriodo.filter((entry) => entry.data === dia && !CATEGORY_RECEITAS.includes(entry.categoria)).length;
                  return (
                    <div key={dia} className="flex min-w-0 items-center gap-2">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-black/10 text-xs font-bold text-white/85">
                        {dia.slice(-2)}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-white/75">
                        {weekday}, {dayMonth(dia, idioma)} ({quantidade})
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-xs font-bold text-white">{formatMoney(valor, idioma)}</span>
                      <span className="hidden h-1 w-12 shrink-0 overflow-hidden rounded-full bg-black/10 2xl:block">
                        <span className="block h-full rounded-full bg-[var(--tema-accent)]" style={{ width: `${pct}%` }} />
                      </span>
                    </div>
                  );
                })}
              {Object.keys(groupByDay).length === 0 && (
                <div className="py-8 text-center text-sm text-white/55">{t('Nenhum lançamento neste período.')}</div>
              )}
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-[color-mix(in_srgb,var(--tema-accent)_62%,#21180f)] p-4 sm:p-5">
            <h2 className="text-lg font-bold text-white">{t('Por categoria')}</h2>
            <div className="mt-4 flex min-w-0 flex-col items-center gap-4">
              <div
                className="grid h-32 w-32 shrink-0 place-items-center rounded-full"
                style={{ background: gradienteDonut }}
                aria-label={t('Gráfico de gastos por categoria')}
                role="img"
              >
                <div className="grid h-20 w-20 place-items-center rounded-full bg-[color-mix(in_srgb,var(--tema-accent)_55%,#21180f)] text-center">
                  <span>
                    <span className="block text-xs text-white/60">{t('Total')}</span>
                    <strong className="mt-1 block whitespace-nowrap text-xs text-white">{formatMoney(totalDespesas, idioma)}</strong>
                  </span>
                </div>
              </div>
              <div className="max-h-40 w-full min-w-0 space-y-2 overflow-y-auto pr-1">
                {categoriasComGasto.map((item) => {
                  const percentual = totalDespesas > 0 ? Math.round((item.valor / totalDespesas) * 100) : 0;
                  return (
                    <div key={item.categoria} className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-x-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: item.cor }} />
                        <span className="truncate text-white/75">{t(CATEGORY_LABELS[item.categoria])}</span>
                      </span>
                      <span className="text-right text-xs font-semibold text-white/65">{percentual}%</span>
                      <span className="col-span-2 truncate pl-[18px] text-xs font-medium text-white">{formatMoney(item.valor, idioma)}</span>
                    </div>
                  );
                })}
                {categoriasComGasto.length === 0 && (
                  <p className="text-center text-sm text-white/55">{t('Nenhum lançamento neste período.')}</p>
                )}
              </div>
            </div>
          </section>

          <section className="min-w-0 overflow-hidden rounded-[1.7rem] border border-white/[0.06] bg-[color-mix(in_srgb,var(--tema-accent)_62%,#21180f)] p-4 sm:p-5">
            <h2 className="text-lg font-bold text-white">{t('Por forma de pagamento')}</h2>
            <div className="mt-4 grid grid-cols-1 gap-2">
              {(Object.entries(gruposPagamento) as [PaymentMethod, number][])
                .sort((a, b) => b[1] - a[1])
                .map(([forma, valor]) => (
                  <div key={forma} className="flex min-w-0 items-center justify-between gap-2 rounded-xl bg-black/[0.08] px-3 py-3">
                    <span className="min-w-0 truncate text-sm text-white/75">{t(PAYMENT_METHOD_LABELS[forma])}</span>
                    <span className="shrink-0 whitespace-nowrap text-xs font-semibold text-white">{formatMoney(valor, idioma)}</span>
                  </div>
                ))}
              {Object.keys(gruposPagamento).length === 0 && (
                <p className="py-4 text-sm text-white/55">{t('Nenhum lançamento neste período.')}</p>
              )}
            </div>
          </section>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

export default Relatorios;
