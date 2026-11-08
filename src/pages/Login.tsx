import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Code2, LogIn, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useI18n } from '../utils/i18n';
import { isInvalidAuthLinkUrl } from '../services/auth-callback';

export function Login() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    const state = location.state;
    const invalidAuthLink = typeof state === 'object'
      && state !== null
      && 'invalidAuthLink' in state
      && state.invalidAuthLink === true;
    return invalidAuthLink || isInvalidAuthLinkUrl(window.location.href)
      ? t('Token inválido.')
      : null;
  });

  const entrarComEmail = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!supabase) {
      setError(t('Configure as variáveis do Supabase para habilitar o login.'));
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;
      navigate('/', { replace: true });
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : String(authError));
      setLoading(false);
    }
  };

  const entrarComGoogle = async () => {
    if (!supabase) {
      setError(t('Configure as variáveis do Supabase para habilitar o login.'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: authError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: window.location.origin },
      });
      if (authError) throw authError;
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : String(authError));
      setLoading(false);
    }
  };

  const entrarComoDesenvolvedor = () => {
    if (!import.meta.env.DEV) return;
    sessionStorage.setItem('mango_developer_bypass', 'true');
    navigate('/', { replace: true });
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-[var(--tema-surface)] p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tema-accent)]">Mango</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t('Entre na sua conta')}</h1>
        <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">
          {t('Acesse seus dados financeiros sincronizados com segurança.')}
        </p>
        <form onSubmit={(event) => void entrarComEmail(event)} className="mt-7 space-y-4">
          <label className="block text-sm font-medium text-[var(--tema-text-secondary)]">
            {t('E-mail')}
            <span className="mt-2 flex items-center gap-3 rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 focus-within:border-[var(--tema-accent)]">
              <Mail className="h-4 w-4 shrink-0" />
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="min-h-12 w-full bg-transparent text-base text-[var(--tema-text-primary)] outline-none"
                placeholder="nome@exemplo.com"
              />
            </span>
          </label>
          <label className="block text-sm font-medium text-[var(--tema-text-secondary)]">
            {t('Senha')}
            <input
              type="password"
              autoComplete="current-password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 min-h-12 w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 text-base text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
            />
          </label>
          <button
            type="submit"
            disabled={loading || !supabase}
            className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
          >
            <LogIn className="h-4 w-4" />
            {loading ? t('Conectando…') : t('Entrar com e-mail')}
          </button>
        </form>
        {error && (
          <p role="alert" className="mt-5 break-words rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
            {error}
          </p>
        )}
        <button
          type="button"
          onClick={() => void entrarComGoogle()}
          disabled={loading || !supabase}
          className="mt-3 flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-[var(--tema-border)] px-5 text-sm font-semibold text-[var(--tema-text-primary)] transition hover:bg-white/[0.04] disabled:opacity-60"
        >
          <LogIn className="h-4 w-4" />
          {loading ? t('Conectando…') : t('Continuar com Google')}
        </button>
        <p className="mt-5 text-center text-sm text-[var(--tema-text-secondary)]">
          {t('Ainda não tem conta?')}{' '}
          <Link to="/register" className="font-semibold text-[var(--tema-accent)] hover:underline">{t('Criar conta')}</Link>
        </p>
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={entrarComoDesenvolvedor}
            className="mt-5 flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-amber-400/30 px-4 text-sm font-medium text-amber-200 transition hover:bg-amber-400/[0.06]"
          >
            <Code2 className="h-4 w-4" />{t('Login de desenvolvedor')}
          </button>
        )}
        {!supabase && (
          <p className="mt-5 text-xs leading-relaxed text-[var(--tema-text-secondary)]">
            {t('Configure as variáveis do Supabase para habilitar o login.')}
          </p>
        )}
      </section>
    </main>
  );
}
