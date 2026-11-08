import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChartNoAxesCombined,
  CreditCard,
  House,
  LogOut,
  LockKeyhole,
  Menu,
  Palette,
  ReceiptText,
  SlidersHorizontal,
  ShieldCheck,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { useMangoStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import { supabase, supabaseConfigured } from '../services/supabase';

const ROTAS_PRINCIPAIS = ['/', '/relatorios', '/cartoes', '/perfil', '/landing'];

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { perfil, syncStatus, syncError, sincronizarAgora, apagarConta } = useMangoStore();
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletePhrase, setDeletePhrase] = useState('');
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  if (!ROTAS_PRINCIPAIS.includes(location.pathname)) return null;

  const titulo = location.pathname === '/relatorios'
    ? t('Relatórios')
    : location.pathname === '/cartoes'
      ? t('Cartões')
      : location.pathname === '/perfil'
        ? t('Editar perfil')
        : location.pathname === '/landing'
          ? 'Mango'
          : t('Meus gastos');

  const avatar = perfil?.avatar ?? '';
  const avatarEhImagem = avatar.length > 0 && !/^[\p{Emoji}\s]+$/u.test(avatar);
  const confirmarApagamento = async () => {
    if (deletePhrase.trim().toLocaleUpperCase() !== t('APAGAR')) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await apagarConta();
      setConfirmDeleteOpen(false);
      setOpen(false);
      navigate(supabaseConfigured ? '/login' : '/first-run', { replace: true });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error));
    } finally {
      setDeleting(false);
    }
  };
  const sairDaConta = async () => {
    setDeleteError(null);
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) throw error;
      }
      sessionStorage.removeItem('mango_developer_bypass');
      setOpen(false);
      navigate('/login', { replace: true });
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : String(error));
    }
  };
  const itens = [
    { titulo: t('Gastos'), detalhe: t('Lançamentos de despesas e receitas'), destino: '/', Icone: ReceiptText },
    { titulo: t('Cartões'), detalhe: t('Gastos do mês cartão a cartão'), destino: '/cartoes', Icone: CreditCard },
    { titulo: t('Editar perfil'), detalhe: t('Nome, avatar e cor de fundo'), destino: '/perfil', Icone: Palette },
    { titulo: t('Segurança'), detalhe: t('Bloqueio do app com PIN e biometria'), destino: '/perfil#seguranca', Icone: LockKeyhole },
    { titulo: t('Diagnóstico'), detalhe: t('Estado do app e armazenamento'), destino: '/diagnostico', Icone: ShieldCheck },
  ];

  return (
    <>
      <header className="relative z-30 mx-auto flex w-full max-w-7xl items-center gap-4 px-4 pt-5 sm:px-8 sm:pt-8">
        <button
          type="button"
          onClick={() => navigate(location.pathname === '/' ? '/landing' : '/')}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[var(--tema-text-secondary)] transition hover:bg-[var(--tema-surface-elevado)] hover:text-[var(--tema-text-primary)]"
          aria-label={t('Voltar')}
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-[1.65rem] font-semibold tracking-tight text-[var(--tema-text-primary)] sm:text-3xl">
          {titulo}
        </h1>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[var(--tema-text-primary)] transition hover:bg-[var(--tema-surface-elevado)]"
          aria-label={t('Abrir menu')}
        >
          <Menu className="h-7 w-7" />
        </button>
      </header>

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end bg-black/60 backdrop-blur-[2px] sm:items-center sm:justify-center sm:p-6"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label={t('Menu de navegação')}
            className="w-full rounded-t-[2rem] border border-white/5 bg-[#111312] px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom))] pt-3 text-stone-100 shadow-2xl sm:max-w-lg sm:rounded-[2rem] sm:pb-6"
          >
            <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-[var(--tema-accent)]/80" />
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-semibold uppercase tracking-[0.18em] text-stone-500">Mango</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-stone-400 hover:bg-white/10 hover:text-white"
                aria-label={t('Fechar')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="space-y-1">
              {itens.map(({ titulo: label, detalhe, destino, Icone }) => (
                <Link
                  key={destino}
                  to={destino}
                  onClick={() => setOpen(false)}
                  className="group flex items-center gap-4 rounded-2xl px-3 py-3.5 transition hover:bg-white/[0.06]"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-white/[0.055] text-[var(--tema-accent)] transition group-hover:bg-[var(--tema-accent)]/15">
                    <Icone className="h-5 w-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-base font-medium text-stone-100">{label}</span>
                    <span className="mt-0.5 block text-sm text-stone-400">{detalhe}</span>
                  </span>
                </Link>
              ))}
            </nav>
            <div className="mt-4 border-t border-white/[0.08] pt-4">
              <div className="mb-3 rounded-xl bg-white/[0.04] px-3 py-3">
                <p className="text-sm font-medium text-stone-200">
                  {t(syncStatus === 'local' ? 'Somente neste dispositivo' : syncStatus === 'synced' ? 'Sincronizado com Supabase' : syncStatus === 'syncing' ? 'Sincronizando…' : syncStatus === 'pending' ? 'Sincronização pendente' : 'Erro de sincronização')}
                </p>
                {syncError && <p className="mt-1 break-words text-xs text-rose-300">{syncError}</p>}
                {syncStatus === 'pending' && (
                  <button
                    type="button"
                    onClick={() => void sincronizarAgora()}
                    className="mt-2 text-xs font-semibold text-[var(--tema-accent)] hover:underline"
                  >
                    {t('Sincronizar agora')}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-3 px-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full border border-white/10 bg-white/[0.06] text-2xl">
                  {avatarEhImagem
                    ? <img src={`data:image/png;base64,${avatar}`} alt="" className="h-full w-full object-cover" />
                    : avatar || <UserRound className="h-5 w-5 text-stone-400" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{perfil?.username || t('Seu perfil')}</p>
                  <p className="text-sm text-stone-400">{t('Controle financeiro pessoal')}</p>
                </div>
                <House className="h-4 w-4 text-stone-600" />
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate('/relatorios'); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-stone-300 transition hover:border-[var(--tema-accent)]/50 hover:text-white"
                >
                  <ChartNoAxesCombined className="h-4 w-4" /> {t('Relatórios')}
                </button>
                <button
                  type="button"
                  onClick={() => { setOpen(false); navigate('/perfil'); }}
                  className="flex items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-stone-300 transition hover:border-[var(--tema-accent)]/50 hover:text-white"
                >
                  <SlidersHorizontal className="h-4 w-4" /> {t('Preferências')}
                </button>
              </div>
              {supabaseConfigured && (
                <button
                  type="button"
                  onClick={() => void sairDaConta()}
                  className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 px-3 py-2.5 text-sm text-stone-300 transition hover:border-white/25 hover:text-white"
                >
                  <LogOut className="h-4 w-4" /> {t('Sair da conta')}
                </button>
              )}
              {deleteError && !confirmDeleteOpen && (
                <p role="alert" className="mt-2 break-words px-2 text-xs text-rose-300">{deleteError}</p>
              )}
              <button
                type="button"
                onClick={() => {
                  setDeletePhrase('');
                  setDeleteError(null);
                  setConfirmDeleteOpen(true);
                }}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 px-3 py-2.5 text-sm text-rose-300 transition hover:bg-rose-500/10"
              >
                <Trash2 className="h-4 w-4" /> {t('Apagar conta')}
              </button>
            </div>
          </section>
        </div>
      )}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 z-[80] grid place-items-center bg-black/75 p-4 backdrop-blur-sm">
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-account-title"
            className="w-full max-w-lg rounded-3xl border border-rose-400/20 bg-[#111312] p-6 text-stone-100 shadow-2xl sm:p-8"
          >
            <h2 id="delete-account-title" className="text-xl font-semibold text-rose-200">{t('Apagar conta')}</h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-300">
              {t(supabaseConfigured
                ? 'Sua sessão e identidade serão removidas agora. Os dados remotos ficarão guardados por 30 dias e poderão ser restaurados se você criar uma conta novamente com este e-mail.'
                : 'Todos os dados salvos neste navegador serão apagados permanentemente.')}
            </p>
            <label htmlFor="delete-account-confirm" className="mt-5 block text-sm text-stone-300">
              {t('Digite APAGAR para confirmar')}
            </label>
            <input
              id="delete-account-confirm"
              type="text"
              autoComplete="off"
              value={deletePhrase}
              onChange={(event) => setDeletePhrase(event.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-black/30 px-3 py-2.5 text-sm outline-none focus:border-rose-400/50"
              autoFocus
            />
            {deleteError && <p role="alert" className="mt-3 break-words text-sm text-rose-300">{deleteError}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeleteOpen(false)}
                disabled={deleting}
                className="rounded-xl border border-white/10 px-4 py-2.5 text-sm text-stone-300 hover:bg-white/5"
              >
                {t('Cancelar')}
              </button>
              <button
                type="button"
                onClick={() => void confirmarApagamento()}
                disabled={deleting || deletePhrase.trim().toLocaleUpperCase() !== t('APAGAR')}
                className="rounded-xl bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {deleting ? t('Apagando…') : t('Apagar permanentemente')}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}

export default Sidebar;
