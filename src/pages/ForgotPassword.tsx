import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../services/supabase';
import { useI18n } from '../utils/i18n';

export function ForgotPassword() {
  const { t } = useI18n();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const enviarLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!supabase) {
      setError(t('Configure as variáveis do Supabase para habilitar o login.'));
      return;
    }

    setLoading(true);
    try {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (authError) throw authError;
      setSent(true);
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
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">{t('Recuperar senha')}</h1>
        <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">
          {t('Informe o e-mail da sua conta para receber um link seguro de redefinição.')}
        </p>
        {sent ? (
          <p role="status" className="register-success-alert mt-7 rounded-2xl border p-5 text-sm font-medium leading-relaxed">
            {t('Se houver uma conta para este e-mail, enviaremos um link para redefinir sua senha.')}
          </p>
        ) : (
          <form onSubmit={(event) => void enviarLink(event)} className="mt-7 space-y-4">
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
            {error && (
              <p role="alert" className="login-error-alert break-words rounded-xl border p-3 text-sm font-semibold">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading || !supabase}
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white transition hover:brightness-110 disabled:opacity-60"
            >
              <Mail className="h-4 w-4" />
              {loading ? t('Enviando link…') : t('Enviar link de redefinição')}
            </button>
          </form>
        )}
        <Link to="/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-semibold text-[var(--tema-accent)] hover:underline">
          <ArrowLeft className="h-4 w-4" />
          {t('Voltar ao login')}
        </Link>
      </section>
    </main>
  );
}
