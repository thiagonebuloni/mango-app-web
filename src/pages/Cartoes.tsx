import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import { CreditCard, Plus, ChevronLeft, ChevronRight, Pencil, TrendingUp, Trash2 } from 'lucide-react';
import { formatMoney, monthYear, todayISO } from '../utils/format';
import { BottomNav } from '../components/BottomNav';
import { useI18n } from '../utils/i18n';
import { categoryIsReceita } from '../types/models';
import { CardNetworkLogo } from '../components/CardNetworkLogo';
import { cardBackgroundForBank } from '../utils/card-appearance';
import type { CartaoCredito } from '../types/models';

function dataDoCiclo(mes: string, dia: number, idioma: string): string {
  const [ano, mesNumero] = mes.split('-').map(Number);
  const data = new Date(ano, mesNumero - 1, Math.min(dia, 28));
  return data.toLocaleDateString(idioma, { day: '2-digit', month: '2-digit' });
}

export function Cartoes() {
  const { idioma, t } = useI18n();
  const navigate = useNavigate();
  const {
    cartoes,
    cartoesLoading,
    despesas,
    meses,
    definirMesCartoes,
    excluirCartao,
  } = useMangoStore();
  const [cartaoParaExcluir, setCartaoParaExcluir] = useState<CartaoCredito | null>(null);
  const [excluindo, setExcluindo] = useState(false);
  const [erroExclusao, setErroExclusao] = useState<string | null>(null);

  const mesCartoes = meses.cartoes;
  const despesasMes = despesas.filter((e) => e.data.startsWith(mesCartoes) && !categoryIsReceita(e.categoria));

  const cartoesOrdenados = useMemo(() => {
    return [...cartoes].sort((a, b) => a.nome.localeCompare(b.nome));
  }, [cartoes]);

  const gastoMensalPorCartao = useMemo(() => {
    const map = new Map<number, number>();
    cartoesOrdenados.forEach((c) => {
      map.set(c.id ?? 0, 0);
    });
    despesasMes.forEach((e) => {
      if (e.cartaoId && map.has(e.cartaoId)) {
        map.set(e.cartaoId, (map.get(e.cartaoId) as number) + e.valorCentavos);
      }
    });
    return map;
  }, [despesasMes, cartoesOrdenados]);

  const irParaAtual = (): void => {
    definirMesCartoes(todayISO().slice(0, 7));
  };

  const mudarMes = (delta: number) => {
    const [ano, mes] = mesCartoes.split('-').map(Number);
    const novaData = new Date(ano, mes - 1 + delta, 1);
    definirMesCartoes(`${novaData.getFullYear()}-${String(novaData.getMonth() + 1).padStart(2, '0')}`);
  };

  const confirmarExclusao = async () => {
    if (cartaoParaExcluir?.id === undefined) return;
    setExcluindo(true);
    setErroExclusao(null);
    try {
      await excluirCartao(cartaoParaExcluir.id);
      setCartaoParaExcluir(null);
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      setErroExclusao(t('Erro ao excluir cartão'));
    } finally {
      setExcluindo(false);
    }
  };

  if (cartoesLoading) {
    return (
      <div className="min-h-screen bg-background px-4 pb-32 pt-6 text-foreground sm:px-6">
        <div className="mx-auto max-w-3xl py-10 text-center">
          <div className="text-gray-400">{t('Carregando cartões…')}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 pb-32 pt-5 text-foreground sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-white/[0.07] bg-white/[0.025] px-2 py-2">
          <button onClick={() => mudarMes(-1)} aria-label={t('Mês anterior')} className="grid h-10 w-10 place-items-center rounded-xl text-stone-400 hover:bg-white/[0.06] hover:text-white">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button onClick={irParaAtual} className="text-base font-semibold capitalize text-stone-100">
            {monthYear(`${mesCartoes}-01`, idioma)}
          </button>
          <button onClick={() => mudarMes(1)} aria-label={t('Próximo mês')} className="grid h-10 w-10 place-items-center rounded-xl text-stone-400 hover:bg-white/[0.06] hover:text-white">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        {cartoesOrdenados.length === 0 ? (
          <div className="rounded-[1.7rem] border border-white/[0.07] bg-[#171615] px-5 py-16 text-center text-stone-400">
            <CreditCard className="mx-auto mb-4 h-12 w-12 text-stone-600" />
            <p className="text-lg font-semibold text-stone-200">{t('Nenhum cartão cadastrado.')}</p>
            <p className="mt-1 text-sm">
              {t('Cadastre um cartão para acompanhar faturas e limite.')}
            </p>
            <button
              type="button"
              onClick={() => navigate('/cartao/nova')}
              className="mt-6 inline-flex min-h-12 items-center gap-2 rounded-2xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110"
            >
              <Plus className="h-5 w-5" />{t('Adicionar cartão')}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:gap-6">
            {cartoesOrdenados.map((cartao) => {
              const gasto = gastoMensalPorCartao.get(cartao.id ?? 0) ?? 0;
              const limite = cartao.limiteCentavos ?? 0;
              const pct = limite > 0 ? Math.min(100, (gasto / limite) * 100) : 0;
              const usado = cartao.limiteCentavos != null && gasto > cartao.limiteCentavos;
              const gradiente = cardBackgroundForBank(cartao.banco);
              return (
                <div
                  key={cartao.id ?? cartao.nome + cartao.banco}
                  className="overflow-hidden rounded-[1.7rem] border border-white/[0.07] bg-[#171615] shadow-[0_16px_40px_rgba(0,0,0,.2)]"
                >
                  <button
                    type="button"
                    onClick={() => navigate(`/cartao/${cartao.id}`)}
                    className="relative flex h-52 w-full flex-col justify-between overflow-hidden p-6 text-left text-white sm:h-60 sm:p-8 2xl:h-64"
                    style={{ background: gradiente }}
                  >
                    <span className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full border border-white/10" />
                    <span className="pointer-events-none absolute -bottom-28 -left-10 h-60 w-60 rounded-full border border-white/10" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xl font-bold">{cartao.banco}</p>
                        <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/65">{t(cartao.bandeira)}</p>
                      </div>
                      <span className="grid h-12 w-[4.75rem] place-items-center rounded-xl bg-white shadow-lg">
                        <CardNetworkLogo network={cartao.bandeira} className="h-10 w-16" />
                      </span>
                    </div>
                    <div className="relative">
                      <h3 className="text-2xl font-bold tracking-tight">{cartao.nome}</h3>
                      <p className="mt-2 text-sm text-white/75">
                        {t('Fecha em')} {dataDoCiclo(mesCartoes, cartao.diaFechamento, idioma)} <span className="mx-1.5">·</span> {t('Pagamento em')} {dataDoCiclo(mesCartoes, cartao.diaPagamento, idioma)}
                      </p>
                    </div>
                  </button>
                  <div className="p-5 sm:p-6">
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-xs font-medium text-stone-400">{t('Total da fatura')}</p>
                        <p className="mt-1 text-3xl font-bold tracking-tight text-stone-100">{formatMoney(gasto, idioma)}</p>
                        <p className="mt-1 text-sm text-stone-400">
                          {gasto > 0 ? t('Gastos neste mês') : t('Sem gastos neste mês')}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => navigate(`/cartao/editar/${cartao.id}`)}
                          className="grid h-10 w-10 place-items-center rounded-xl text-stone-400 transition hover:bg-white/[0.06] hover:text-white"
                          aria-label={`${t('Editar cartão')}: ${cartao.nome}`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setErroExclusao(null);
                            setCartaoParaExcluir(cartao);
                          }}
                          className="grid h-10 w-10 place-items-center rounded-xl text-rose-300/80 transition hover:bg-rose-500/10 hover:text-rose-200"
                          aria-label={`${t('Excluir cartão')}: ${cartao.nome}`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    {limite > 0 && (
                      <>
                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
                          <div
                            className={`h-full rounded-full transition-all ${usado ? 'bg-rose-400' : 'bg-[var(--tema-accent)]'}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <div className="mt-2 flex items-center justify-between gap-3 text-xs text-stone-400">
                          <span>{t('Disponível')}: {formatMoney(Math.max(0, limite - gasto), idioma)}</span>
                          {usado && <span className="font-semibold text-rose-300">{t('Limite estourado')}</span>}
                          {!usado && <span className="flex items-center gap-1"><TrendingUp className="h-3 w-3" />{t('Limite')}: {formatMoney(limite, idioma)}</span>}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {cartoesOrdenados.length > 0 && (
          <button
            onClick={() => navigate('/cartao/nova')}
            className="fixed bottom-24 right-5 z-[60] flex h-16 items-center gap-3 rounded-[1.35rem] bg-[var(--tema-accent)] px-6 text-sm font-semibold text-white shadow-[0_12px_34px_color-mix(in_srgb,var(--tema-accent)_40%,transparent)] transition hover:-translate-y-0.5 sm:bottom-28 sm:right-[max(calc((100vw-64rem)/2),2rem)] lg:bottom-8 lg:right-[max(calc((100vw-80rem)/2),2rem)]"
          >
            <Plus className="h-5 w-5" /> {t('Adicionar cartão')}
          </button>
        )}
        {cartaoParaExcluir && (
          <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
            <section
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="delete-card-title"
              className="w-full max-w-lg rounded-3xl border border-rose-400/20 bg-[#111312] p-6 text-stone-100 shadow-2xl sm:p-8"
            >
              <h2 id="delete-card-title" className="text-xl font-semibold text-rose-200">{t('Excluir cartão')}</h2>
              <p className="mt-3 text-sm leading-relaxed text-stone-300">
                {t('Deseja excluir o cartão')} <strong>{cartaoParaExcluir.nome}</strong>? {t('As despesas associadas serão mantidas no histórico.')}
              </p>
              {erroExclusao && <p role="alert" className="mt-3 break-words text-sm text-rose-300">{erroExclusao}</p>}
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setCartaoParaExcluir(null)}
                  disabled={excluindo}
                  className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-stone-300 hover:bg-white/5 disabled:opacity-50"
                >
                  {t('Cancelar')}
                </button>
                <button
                  type="button"
                  onClick={() => void confirmarExclusao()}
                  disabled={excluindo}
                  className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {excluindo ? t('Excluindo…') : t('Excluir cartão')}
                </button>
              </div>
            </section>
          </div>
        )}
      <BottomNav />
      </div>
    </div>
  );
}

export default Cartoes;
