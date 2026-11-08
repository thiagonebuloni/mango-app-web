import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useI18n } from '../utils/i18n';

export function Register() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const criarConta = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError(t('As senhas não correspondem.'));
      return;
    }
    if (!supabase) {
      setError(t('Configure as variáveis do Supabase para habilitar o login.'));
      return;
    }

    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      if (authError) throw authError;
      if (data.session) {
        navigate('/', { replace: true });
        return;
      }
      setSuccess(true);
    } catch (authError) {
      setError(authError instanceof Error ? authError.message : String(authError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-[var(--tema-surface)] p-8 shadow-2xl sm:p-10">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--tema-accent)]">Mango</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t('Criar sua conta')}</h1>
        <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">{t('Cadastre-se com seu e-mail e uma senha segura.')}</p>
        {success ? (
          <div className="mt-7 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-5 text-sm leading-relaxed text-emerald-100" role="status">
            {t('Conta criada. Verifique seu e-mail para confirmar o cadastro antes de entrar.')}
          </div>
        ) : (
          <form onSubmit={(event) => void criarConta(event)} className="mt-7 space-y-4">
            <label className="block text-sm font-medium text-[var(--tema-text-secondary)]">
              {t('E-mail')}
              <input
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 text-base text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
                placeholder="nome@exemplo.com"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--tema-text-secondary)]">
              {t('Senha')}
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 text-base text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
              />
            </label>
            <label className="block text-sm font-medium text-[var(--tema-text-secondary)]">
              {t('Confirmar senha')}
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                className="mt-2 min-h-12 w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 text-base text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
              />
            </label>
            {error && (
              <p role="alert" className="break-words rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !supabase}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <UserPlus className="h-4 w-4" />
              {loading ? t('Criando conta…') : t('Criar conta')}
            </button>
          </form>
        )}
        <p className="mt-5 text-center text-sm text-[var(--tema-text-secondary)]">
          {t('Já tem uma conta?')}{' '}
          <Link to="/login" className="font-semibold text-[var(--tema-accent)] hover:underline">{t('Entrar')}</Link>
        </p>
        {!supabase && (
          <p className="mt-5 text-xs leading-relaxed text-[var(--tema-text-secondary)]">
            {t('Configure as variáveis do Supabase para habilitar o login.')}
          </p>
        )}
      </section>
    </main>
  );
}
