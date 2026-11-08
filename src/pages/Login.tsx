import { useState } from 'react';
import { LogIn } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useI18n } from '../utils/i18n';

export function Login() {
  const { t } = useI18n();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const entrarComGoogle = async () => {
    if (!supabase) {
      setError(t('Configure as variáveis do Supabase para habilitar o login.'));
      return;
    }
    setLoading(true);
    setError(null);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (authError) {
      setError(authError.message);
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-[var(--tema-surface)] p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tema-accent)]">Mango</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t('Entre na sua conta')}</h1>
        <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">
          {t('Acesse seus dados financeiros sincronizados com segurança.')}
        </p>
        {error && (
          <p role="alert" className="mt-5 rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void entrarComGoogle()}
          disabled={loading}
          className="mt-8 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {loading ? t('Conectando…') : t('Continuar com Google')}
        </button>
        {!supabase && (
          <p className="mt-5 text-xs leading-relaxed text-[var(--tema-text-secondary)]">
            {t('Configure as variáveis do Supabase para habilitar o login.')}
          </p>
        )}
      </section>
    </main>
  );
}
