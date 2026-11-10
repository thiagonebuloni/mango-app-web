import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import { formatMoney, monthYear, todayISO } from '../utils/format';
import { SummaryCard } from '../components/SummaryCard';
import { ExpenseTile } from '../components/ExpenseTile';
import { BottomNav } from '../components/BottomNav';
import { useI18n } from '../utils/i18n';
import { categoryIsReceita } from '../types/models';

export function Home() {
  const { idioma, t } = useI18n();
  const navigate = useNavigate();
  const {
    despesas,
    despesasLoading,
    meses,
    definirMesGastos,
    excluirDespesa,
  } = useMangoStore();

  const [filtro, setFiltro] = useState<'dia' | 'semana' | 'mes'>('mes');
  const [mesDialog, setMesDialog] = useState<boolean>(false);
  const [atalhosAbertos, setAtalhosAbertos] = useState(false);
  const [dialogYear, setDialogYear] = useState<number>(new Date().getFullYear());
  const [dialogMonth, setDialogMonth] = useState<number>(new Date().getMonth());
  const [lancamentoParaExcluir, setLancamentoParaExcluir] = useState<(typeof despesas)[number] | null>(null);
  const [excluindoLancamento, setExcluindoLancamento] = useState(false);
  const [erroExclusaoLancamento, setErroExclusaoLancamento] = useState<string | null>(null);

  const mesAtual = meses.gastos; // YYYY-MM

  const despesasMes = despesas.filter((e) => e.data.startsWith(mesAtual));
  const hoje = todayISO();
  const inicioSemana = new Date();
  inicioSemana.setDate(inicioSemana.getDate() - inicioSemana.getDay());
  const inicioISO = `${inicioSemana.getFullYear()}-${String(inicioSemana.getMonth() + 1).padStart(2, '0')}-${String(inicioSemana.getDate()).padStart(2, '0')}`;
  const lancamentosDia = despesas.filter((e) => e.data === hoje);
  const lancamentosSemana = despesas.filter((e) => e.data >= inicioISO && e.data <= hoje);
  const total = (lancamentos: typeof despesas) => lancamentos
    .filter((e) => !categoryIsReceita(e.categoria))
    .reduce((acc, e) => acc + e.valorCentavos, 0);
  const totalDespesas = total(despesasMes);
  const totalDia = total(lancamentosDia);
  const totalSemana = total(lancamentosSemana);
  const receitasMes = despesasMes
    .filter((e) => categoryIsReceita(e.categoria))
    .reduce((acc, e) => acc + e.valorCentavos, 0);
  const visiveis = filtro === 'dia'
    ? lancamentosDia
    : filtro === 'semana'
      ? lancamentosSemana
      : despesasMes;

  const anoAtual = parseInt(mesAtual.split('-')[0], 10);
  const mesAtualNum = parseInt(mesAtual.split('-')[1], 10);

  const irParaMes = (ano: number, mes: number) => {
    const novo = `${ano}-${String(mes).padStart(2, '0')}`;
    definirMesGastos(novo);
    setMesDialog(false);
  };

  const mudarMes = (delta: number) => {
    const [ano, mes] = mesAtual.split('-').map(Number);
    const novoMes = new Date(ano, mes - 1 + delta, 1);
    definirMesGastos(`${novoMes.getFullYear()}-${String(novoMes.getMonth() + 1).padStart(2, '0')}`);
  };

  const confirmarExclusaoLancamento = async () => {
    if (lancamentoParaExcluir?.id === undefined || excluindoLancamento) return;
    setExcluindoLancamento(true);
    setErroExclusaoLancamento(null);
    try {
      await excluirDespesa(lancamentoParaExcluir.id);
      setLancamentoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir lançamento:', error);
      setErroExclusaoLancamento(error instanceof Error ? error.message : t('Erro ao excluir lançamento'));
    } finally {
      setExcluindoLancamento(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 pb-32 pt-5 text-foreground sm:px-6 sm:pt-8">
      {/* Cabeçalho */}
      <div className="mx-auto mb-7 flex w-full max-w-7xl flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tema-accent)]">{t('Visão geral')}</p>
          <h2 className="text-3xl font-semibold tracking-tight text-[var(--tema-text-primary)] lg:text-4xl">{t('Seus gastos, com clareza.')}</h2>
          <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">
            {t('Acompanhe o ritmo do seu dinheiro.')}
          </p>
        </div>
        <div className="flex w-full items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-3 py-2 lg:max-w-md">
          <button
            onClick={() => mudarMes(-1)}
            className="grid h-10 w-10 place-items-center rounded-xl text-stone-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label={t('Mês anterior')}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => {
              setDialogYear(anoAtual);
              setDialogMonth(mesAtualNum - 1);
              setMesDialog(true);
            }}
            className="flex min-w-0 flex-col items-center px-3 py-1"
          >
            <span className="text-base font-semibold capitalize text-stone-100">{monthYear(`${mesAtual}-01`, idioma)}</span>
            <span className="mt-0.5 text-xs text-stone-500">{formatMoney(totalDespesas, idioma)} {t('em despesas')}</span>
          </button>
          <button
            onClick={() => mudarMes(1)}
            className="grid h-10 w-10 place-items-center rounded-xl text-stone-400 transition hover:bg-white/[0.06] hover:text-white"
            aria-label={t('Próximo mês')}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Cards de resumo */}
      <div className="mx-auto mb-6 grid w-full max-w-7xl grid-cols-3 gap-2.5 sm:gap-4 lg:mb-8 lg:gap-5">
        <SummaryCard
          label="Dia"
          value={totalDia}
          selected={filtro === 'dia'}
          onTap={() => setFiltro('dia')}
        />
        <SummaryCard
          label="Semana"
          value={totalSemana}
          selected={filtro === 'semana'}
          onTap={() => setFiltro('semana')}
        />
        <SummaryCard
          label="Mês"
          value={totalDespesas}
          selected={filtro === 'mes'}
          onTap={() => setFiltro('mes')}
        />
      </div>

      {/* Lista de despesas */}
      <div className="mx-auto grid w-full max-w-7xl gap-6 xl:grid-cols-[minmax(0,1.8fr)_minmax(17rem,.8fr)]">
      <section className="min-w-0">
        <div className="mb-3 flex items-end justify-between px-1">
          <div>
            <h2 className="text-lg font-semibold text-[var(--tema-text-primary)]">{t('Lançamentos')}</h2>
            <p className="text-xs text-[var(--tema-text-secondary)]">{t(filtro === 'dia' ? 'Hoje' : filtro === 'semana' ? 'Esta semana' : 'Este mês')}</p>
          </div>
          <span className="text-xs text-stone-500">{visiveis.length} {t('itens')}</span>
        </div>
        <div className="divide-y divide-white/[0.06]">
          {despesasLoading ? (
            <div className="py-10 text-center text-stone-400">{t('Carregando...')}</div>
          ) : visiveis.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 py-12 text-center text-stone-500">
              {t('Nenhum lançamento neste período.')}
            </div>
          ) : (
            visiveis
              .slice()
              .sort((a, b) => b.data.localeCompare(a.data) || (b.id ?? 0) - (a.id ?? 0))
              .map((e) => (
                <ExpenseTile
                  key={e.id ?? e.estabelecimento + e.data}
                  expense={e}
                  onTap={() => navigate(`/despesa/editar/${e.id}`)}
                  onDelete={() => {
                    setErroExclusaoLancamento(null);
                    setLancamentoParaExcluir(e);
                  }}
                />
              ))
          )}
        </div>
      </section>
      <aside className="grid grid-cols-2 content-start gap-3 xl:grid-cols-1 xl:gap-4">
        <div className="flex items-center gap-3 rounded-2xl border border-rose-400/10 bg-rose-500/[0.055] p-4 text-sm text-rose-200/80 xl:p-5">
          <TrendingDown className="h-5 w-5 shrink-0 text-rose-300" />
          <span>{t('Despesas do mês')} <strong className="mt-1 block text-lg text-rose-100">{formatMoney(totalDespesas, idioma)}</strong></span>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border border-emerald-400/10 bg-emerald-500/[0.055] p-4 text-sm text-emerald-200/80 xl:p-5">
          <TrendingUp className="h-5 w-5 shrink-0 text-emerald-300" />
          <span>{t('Receitas do mês')} <strong className="mt-1 block text-lg text-emerald-100">{formatMoney(receitasMes, idioma)}</strong></span>
        </div>
      </aside>
      </div>

      <div className="fixed bottom-24 right-5 z-[60] flex flex-col items-end gap-3 sm:bottom-28 sm:right-[max(calc((100vw-64rem)/2),2rem)] lg:bottom-8 lg:right-[max(calc((100vw-80rem)/2),2rem)]">
        {atalhosAbertos && (
          <div className="flex flex-col items-end gap-2">
            <button
              onClick={() => navigate('/receita/nova')}
              className="rounded-full border border-emerald-400/20 bg-[#171b19] px-4 py-3 text-sm font-medium text-emerald-300 shadow-xl"
            >
              + {t('Nova receita')}
            </button>
            <button
              onClick={() => navigate('/despesa/nova')}
              className="rounded-full border border-white/10 bg-[#171b19] px-4 py-3 text-sm font-medium text-stone-100 shadow-xl"
            >
              + {t('Nova despesa')}
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={() => setAtalhosAbertos((open) => !open)}
          aria-label={atalhosAbertos ? t('Fechar atalhos') : t('Novo lançamento')}
          aria-expanded={atalhosAbertos}
          className="grid h-[4.5rem] w-[4.5rem] place-items-center rounded-[1.65rem] bg-[var(--tema-accent)] text-white shadow-[0_12px_34px_color-mix(in_srgb,var(--tema-accent)_40%,transparent)] transition hover:scale-[1.04] active:scale-95"
        >
          <Plus className={`h-8 w-8 transition-transform ${atalhosAbertos ? 'rotate-45' : ''}`} />
        </button>
      </div>

      {/* Diálogo de seleção de mês */}
      {lancamentoParaExcluir && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-entry-title"
            className="w-full max-w-md rounded-3xl border border-rose-400/20 bg-[#111312] p-6 text-stone-100 shadow-2xl"
          >
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-500/10 text-rose-300">
                <Trash2 className="h-5 w-5" />
              </span>
              <h2 id="delete-entry-title" className="text-lg font-semibold">{t('Excluir lançamento')}</h2>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-stone-300">
              {t('Deseja excluir o lançamento')} <strong className="text-white">{lancamentoParaExcluir.estabelecimento}</strong>?
            </p>
            {erroExclusaoLancamento && (
              <p role="alert" className="mt-3 break-words text-sm text-rose-300">{erroExclusaoLancamento}</p>
            )}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setLancamentoParaExcluir(null)}
                disabled={excluindoLancamento}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-stone-300 hover:bg-white/5 disabled:opacity-50"
              >
                {t('Cancelar')}
              </button>
              <button
                type="button"
                onClick={() => void confirmarExclusaoLancamento()}
                disabled={excluindoLancamento}
                className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {excluindoLancamento ? t('Excluindo…') : t('Excluir lançamento')}
              </button>
            </div>
          </section>
        </div>
      )}
      {mesDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-gray-900 rounded-xl p-6 max-w-sm w-full border border-gray-700">
            <h2 className="text-lg font-bold mb-4">{t('Selecionar mês')}</h2>
            <div className="flex justify-between items-center mb-6">
              <button
                onClick={() => setDialogYear((y) => y - 1)}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
              >
                {'<'}
              </button>
              <span className="font-mono text-lg">{dialogYear}</span>
              <button
                onClick={() => setDialogYear((y) => y + 1)}
                className="px-3 py-1 rounded bg-gray-800 hover:bg-gray-700"
              >
                {'>'}
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {(idioma === 'pt-BR'
                ? ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
                : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
              ).map((m, i) => {
                const selecionado = i === dialogMonth && dialogYear === anoAtual;
                return (
                  <button
                    key={m}
                    onClick={() => irParaMes(dialogYear, i + 1)}
                    className={`py-2 rounded text-sm transition-colors ${
                      selecionado
                        ? 'bg-[var(--tema-accent)] text-white font-bold'
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    {m}
                  </button>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setMesDialog(false)}
                className="px-4 py-2 rounded bg-gray-800 text-gray-300 hover:bg-gray-700"
              >
                {t('Fechar')}
              </button>
            </div>
          </div>
        </div>
      )}
      <BottomNav />
    </div>
  );
}

export default Home;
