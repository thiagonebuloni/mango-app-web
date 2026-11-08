import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Session } from '@supabase/supabase-js';
import { supabase, supabaseConfigured } from '../services/supabase';
import { useMangoStore } from '../store/useStore';
import { useI18n } from '../utils/i18n';
import { errorMessage } from '../services/error-message';
import { isInvalidAuthLinkError, isInvalidAuthLinkUrl } from '../services/auth-callback';

interface SupabaseAuthGateProps {
  children: ReactNode;
}

export function SupabaseAuthGate({ children }: SupabaseAuthGateProps) {
  const { t } = useI18n();
  const location = useLocation();
  const [session, setSession] = useState<Session | null>(null);
  const [connectedUserId, setConnectedUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(supabaseConfigured);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [retry, setRetry] = useState(0);
  const [invalidAuthLink, setInvalidAuthLink] = useState(() => isInvalidAuthLinkUrl(window.location.href));
  const sessionUserId = session?.user.id;
  const developerBypass = import.meta.env.DEV
    && sessionStorage.getItem('mango_developer_bypass') === 'true';

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setSyncError(null);
        if (!nextSession) setConnectedUserId(null);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        if (isInvalidAuthLinkError(error)) setInvalidAuthLink(true);
        else setSyncError(error.message);
      }
      setSession(data.session);
      if (!data.session) setConnectedUserId(null);
      setAuthLoading(false);
    }).catch((error: unknown) => {
      if (!active) return;
      console.error('Erro ao recuperar a sessão Supabase:', error);
      if (isInvalidAuthLinkError(error)) setInvalidAuthLink(true);
      else setSyncError(errorMessage(error));
      setAuthLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabaseConfigured || authLoading) return;
    if (!sessionUserId) {
      useMangoStore.setState({ userId: null, syncStatus: 'local', syncError: null });
      return;
    }

    let active = true;
    useMangoStore.getState().conectarConta(sessionUserId).then(() => {
      if (active) setConnectedUserId(sessionUserId);
    }).catch((error: unknown) => {
      if (!active) return;
      setSyncError(errorMessage(error));
    });

    return () => {
      active = false;
    };
  }, [authLoading, sessionUserId, retry]);

  useEffect(() => {
    if (!supabaseConfigured) return;
    const retrySync = () => {
      void useMangoStore.getState().sincronizarAgora();
    };
    window.addEventListener('online', retrySync);
    return () => window.removeEventListener('online', retrySync);
  }, []);

  if (developerBypass) return children;
  if (!supabaseConfigured) return children;

  const hasInvalidAuthLink = invalidAuthLink
    || isInvalidAuthLinkUrl(`${window.location.origin}${location.pathname}${location.search}${location.hash}`)
    || (typeof location.state === 'object'
      && location.state !== null
      && 'invalidAuthLink' in location.state
      && location.state.invalidAuthLink === true);

  if (hasInvalidAuthLink && location.pathname !== '/login') {
    return <Navigate to="/login" replace state={{ invalidAuthLink: true }} />;
  }

  if (authLoading || (sessionUserId && connectedUserId !== sessionUserId && !syncError)) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <p className="text-sm text-[var(--tema-text-secondary)]">{t('Conectando sua conta…')}</p>
      </main>
    );
  }

  if (location.pathname === '/login' || location.pathname === '/register') {
    return session && !hasInvalidAuthLink ? <Navigate to="/" replace /> : children;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (syncError) {
    return (
      <main className="grid min-h-screen place-items-center bg-background px-6 text-foreground">
        <section className="w-full max-w-lg rounded-3xl border border-rose-400/20 bg-[var(--tema-surface)] p-8 text-center">
          <h1 className="text-xl font-semibold">{t('Não foi possível sincronizar sua conta')}</h1>
          <p className="mt-3 break-words text-sm text-[var(--tema-text-secondary)]">{syncError}</p>
          <button
            type="button"
            onClick={() => {
              setSyncError(null);
              setRetry((value) => value + 1);
            }}
            className="mt-6 rounded-xl bg-[var(--tema-accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            {t('Tentar novamente')}
          </button>
        </section>
      </main>
    );
  }

  return children;
}
