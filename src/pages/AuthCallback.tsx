import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { errorMessage } from '../services/error-message';
import { isInvalidAuthLinkUrl } from '../services/auth-callback';
import { useI18n } from '../utils/i18n';

export function AuthCallback() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(() => (
    isInvalidAuthLinkUrl(window.location.href)
      ? t('Token inválido.')
      : supabase
        ? null
        : t('Configure as variáveis do Supabase para habilitar o login.')
  ));

  useEffect(() => {
    if (!supabase) return;

    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active && session) navigate('/', { replace: true });
    });

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return;
      if (sessionError) {
        setError(sessionError.message);
      } else if (data.session) {
        navigate('/', { replace: true });
      } else if (!isInvalidAuthLinkUrl(window.location.href)) {
        setError(t('Não foi possível concluir o login com Google. Tente novamente.'));
      }
    }).catch((sessionError: unknown) => {
      if (active) setError(errorMessage(sessionError));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [navigate, t]);

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-md rounded-[2rem] border border-[var(--tema-border)] bg-[var(--tema-surface)] p-8 text-center shadow-2xl sm:p-10">
        <p className="text-sm text-[var(--tema-text-secondary)]">
          {error ? t('Não foi possível entrar na conta.') : t('Conectando sua conta…')}
        </p>
        {error && (
          <>
            <p role="alert" className="mt-4 break-words rounded-xl border border-rose-500/40 bg-rose-500/10 p-3 text-sm text-rose-800 dark:text-rose-200">
              {error}
            </p>
            <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-[var(--tema-accent)] hover:underline">
              {t('Voltar ao login')}
            </Link>
          </>
        )}
      </section>
    </main>
  );
}
