import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, ChevronRight, CreditCard, PieChart, ReceiptText, Sparkles } from 'lucide-react';
import { useMangoStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import { BottomNav } from '../components/BottomNav';

export function Landing() {
  const navigate = useNavigate();
  const { perfil, perfilLoading } = useMangoStore();
  const { t } = useI18n();

  useEffect(() => {
    if (!perfilLoading && perfil == null) {
      navigate('/first-run');
    }
  }, [navigate, perfilLoading, perfil]);

  if (perfilLoading || !perfil) return null;

  const avatar = perfil.avatar ?? '';
  const avatarEhImagem = avatar.length > 0 && !/^[\p{Emoji}\s]+$/u.test(avatar);
  const atalhos = [
    { to: '/', icon: ReceiptText, title: 'Gastos', detail: 'Lançamentos de despesas e receitas' },
    { to: '/relatorios', icon: PieChart, title: 'Relatórios', detail: 'Resumo e análises do período' },
    { to: '/cartoes', icon: CreditCard, title: 'Cartões', detail: 'Faturas e limites disponíveis' },
  ];

  return (
    <main className="min-h-[calc(100vh-5rem)] bg-background px-4 pb-32 pt-5 text-foreground sm:px-6 sm:pt-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[1.15fr_.85fr] lg:items-center lg:gap-8">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/[0.07] bg-[color-mix(in_srgb,var(--tema-accent)_60%,#21180f)] p-6 text-white shadow-[0_20px_50px_rgba(0,0,0,.2)] sm:p-9 lg:flex lg:min-h-[27rem] lg:items-center lg:p-10">
          <div className="pointer-events-none absolute -right-12 -top-20 h-64 w-64 rounded-full border border-white/[0.08]" />
          <div className="pointer-events-none absolute -right-2 -top-10 h-44 w-44 rounded-full border border-white/[0.07]" />
          <div className="relative">
            <div className="flex items-center gap-4">
              <div className="grid h-[9rem] w-[9rem] shrink-0 place-items-center overflow-hidden rounded-full border-2 border-white/20 bg-black/20 text-7xl">
                {avatarEhImagem
                  ? <img src={`data:image/png;base64,${avatar}`} alt="" className="h-full w-full object-cover" />
                  : avatar || '👤'}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-white/65">{t('Bem-vindo(a) ao Mango')}</p>
                <h2 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">{perfil.username || t('Seu perfil')}</h2>
              </div>
            </div>
            <p className="mt-6 max-w-lg text-sm leading-relaxed text-white/70 sm:text-base">
              {t('Seu dinheiro, organizado em um só lugar.')}
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => navigate('/despesa/nova')}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl bg-[var(--tema-accent)] px-4 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
              >
                <ArrowDownLeft className="h-5 w-5" />{t('Nova despesa')}
              </button>
              <button
                type="button"
                onClick={() => navigate('/receita/nova')}
                className="flex min-h-14 items-center justify-center gap-2 rounded-2xl border border-white/20 bg-black/15 px-4 text-sm font-semibold text-white transition hover:bg-black/25"
              >
                <ArrowUpRight className="h-5 w-5" />{t('Nova receita')}
              </button>
            </div>
          </div>
        </section>

        <section>
          <div className="mb-4 flex items-center gap-2 px-1">
            <Sparkles className="h-4 w-4 text-[var(--tema-accent)]" />
            <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-[var(--tema-text-secondary)]">{t('Seu espaço financeiro')}</h3>
          </div>
          <nav className="space-y-3 lg:space-y-4">
            {atalhos.map(({ to, icon: Icon, title, detail }) => (
              <Link
                key={to}
                to={to}
                className="group flex items-center gap-4 rounded-[1.4rem] border border-[var(--tema-border)] bg-[var(--tema-surface)] p-4 transition hover:-translate-y-0.5 hover:border-[var(--tema-accent)]/50 sm:p-5 lg:p-6"
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[var(--tema-accent)]/15 text-[var(--tema-accent)] lg:h-14 lg:w-14">
                  <Icon className="h-5 w-5 lg:h-6 lg:w-6" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[var(--tema-text-primary)]">{t(title)}</span>
                  <span className="mt-1 block text-sm text-[var(--tema-text-secondary)]">{t(detail)}</span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-[var(--tema-text-secondary)] transition group-hover:translate-x-1 group-hover:text-[var(--tema-accent)]" />
              </Link>
            ))}
          </nav>
        </section>
      </div>
      <BottomNav />
    </main>
  );
}

export default Landing;
