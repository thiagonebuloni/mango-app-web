import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { supabase } from '../services/supabase';
import { isInvalidAuthLinkUrl } from '../services/auth-callback';
import { useI18n } from '../utils/i18n';

type LinkStatus = 'checking' | 'invalid' | 'ready' | 'updated';

export function ResetPassword() {
  const { t } = useI18n();
  const [linkStatus, setLinkStatus] = useState<LinkStatus>(() => (
    !supabase || isInvalidAuthLinkUrl(window.location.href) ? 'invalid' : 'checking'
  ));
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => (
    supabase ? null : t('Configure as variáveis do Supabase para habilitar o login.')
  ));

  useEffect(() => {
    if (!supabase || isInvalidAuthLinkUrl(window.location.href)) return;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN')) {
        setLinkStatus('ready');
      }
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
        setLinkStatus('invalid');
      } else {
        setLinkStatus(data.session ? 'ready' : 'invalid');
      }
    }).catch((sessionError: unknown) => {
      if (!active) return;
      setError(sessionError instanceof Error ? sessionError.message : String(sessionError));
      setLinkStatus('invalid');
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const alterarSenha = async (event: FormEvent<HTMLFormElement>) => {
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
      const { error: authError } = await supabase.auth.updateUser({ password });
      if (authError) throw authError;
      setPassword('');
      setConfirmPassword('');
      setLinkStatus('updated');
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
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t('Criar nova senha')}</h1>
        {linkStatus === 'checking' && (
          <p role="status" className="mt-4 text-sm text-[var(--tema-text-secondary)]">{t('Validando link de redefinição…')}</p>
        )}
        {linkStatus === 'invalid' && (
          <>
            <p className="mt-3 text-sm text-[var(--tema-text-secondary)]">
              {t('Este link de redefinição é inválido ou expirou. Solicite um novo link para continuar.')}
            </p>
            {error && <p role="alert" className="login-error-alert mt-4 break-words rounded-xl border p-3 text-sm font-semibold">{error}</p>}
            <Link to="/forgot-password" className="mt-6 flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110">
              <ArrowLeft className="h-4 w-4" />
              {t('Solicitar novo link')}
            </Link>
          </>
        )}
        {linkStatus === 'ready' && (
          <>
            <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">{t('Escolha uma nova senha para sua conta.')}</p>
            <form onSubmit={(event) => void alterarSenha(event)} className="mt-7 space-y-4">
              <label className="block text-sm font-medium text-[var(--tema-text-secondary)]">
                {t('Nova senha')}
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
                {t('Confirmar nova senha')}
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
                <p role="alert" className="login-error-alert break-words rounded-xl border p-3 text-sm font-semibold">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
              >
                <KeyRound className="h-4 w-4" />
                {loading ? t('Salvando senha…') : t('Salvar nova senha')}
              </button>
            </form>
          </>
        )}
        {linkStatus === 'updated' && (
          <>
            <p role="status" className="register-success-alert mt-4 rounded-2xl border p-5 text-sm font-medium leading-relaxed">
              {t('Senha alterada com sucesso.')}
            </p>
            <Link to="/" className="mt-6 flex min-h-12 items-center justify-center rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110">
              {t('Continuar para o Mango')}
            </Link>
          </>
        )}
        {linkStatus !== 'updated' && linkStatus !== 'invalid' && (
          <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--tema-accent)] hover:underline">
            <ArrowLeft className="h-4 w-4" />
            {t('Voltar ao login')}
          </Link>
        )}
      </section>
    </main>
  );
}
