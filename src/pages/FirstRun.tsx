import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import { Camera, Check, CheckCircle2, Globe, Moon, Palette, Sun, User } from 'lucide-react';
import { aplicarTema, CORES_FUNDO_PASTEL, corParaTemaCor } from '../utils/theme';
import { useI18n } from '../utils/i18n';
import { errorMessage } from '../services/error-message';

const CORES = CORES_FUNDO_PASTEL;

const AVATARES = ['🙂', '😄', '😎', '🤓', '🥳', '🤩', '🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🌟', '🍀'];

export function FirstRun() {
  const navigate = useNavigate();
  const { salvarPerfil, definirIdioma } = useMangoStore();
  const { t } = useI18n();
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const [temaClaro, setTemaClaro] = useState(false);
  const [corSelecionada, setCorSelecionada] = useState(CORES[0].valor);
  const [idioma, setIdioma] = useState<'pt-BR' | 'en-US'>('pt-BR');
  const [username, setUsername] = useState('');
  const [avatar, setAvatar] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const temaCor = corParaTemaCor(corSelecionada);
  const avatarEhImagem = avatar.length > 0 && !/^[\p{Emoji}\s]+$/u.test(avatar);

  useEffect(() => {
    aplicarTema(temaClaro, temaCor, corSelecionada);
  }, [temaClaro, temaCor, corSelecionada]);

  const concluir = async () => {
    setEnviando(true);
    setErroSalvar(null);
    try {
      await salvarPerfil({
        temaClaro,
        corFundo: parseInt(corSelecionada.replace('#', ''), 16),
        temaCor,
        idioma,
        username: username.trim(),
        avatar,
      });
      definirIdioma(idioma);
      navigate('/');
    } catch (error) {
      console.error('Erro ao concluir configuração inicial:', error);
      setErroSalvar(errorMessage(error));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 pb-12 pt-5 text-foreground sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-[var(--tema-text-primary)]">{t('Bem-vindo ao Mango')}</h1>
          <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">
            {t('Vamos configurar o seu perfil antes de começar.')}
          </p>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
          <section className="rounded-[1.8rem] border border-white/[0.06] bg-[color-mix(in_srgb,var(--tema-accent)_60%,#21180f)] px-5 py-7 text-center shadow-[0_16px_38px_rgba(0,0,0,.18)]">
            <div className="relative mx-auto h-32 w-32">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="grid h-full w-full place-items-center overflow-hidden rounded-full border-[5px] border-[#151515] bg-[var(--tema-surface-elevado)] text-6xl shadow-xl"
                aria-label={t('Trocar avatar')}
              >
                {avatarEhImagem
                  ? <img src={`data:image/png;base64,${avatar}`} alt={t('Avatar')} className="h-full w-full object-cover" />
                  : avatar || '👤'}
              </button>
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="absolute -bottom-1 -right-2 z-10 grid h-10 w-10 place-items-center rounded-full border-2 border-[#151515] bg-[var(--tema-accent)] text-white shadow-lg transition hover:scale-105"
                aria-label={t('Trocar foto do avatar')}
              >
                <Camera className="h-4 w-4" />
              </button>
            </div>
            <p className="mt-4 text-sm text-white/65">{t('Escolha seu avatar')}</p>
            <p className="mt-1 text-2xl font-bold text-white">{username.trim() || t('Seu nome')}</p>
            <div className="mt-5 flex items-center justify-center gap-2 text-sm text-white/70">
              <span className="h-3 w-3 rounded-full ring-2 ring-white/40" style={{ backgroundColor: corSelecionada }} />
              <span>{t(temaClaro ? 'Tema claro' : 'Tema escuro')}</span>
            </div>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') setAvatar(reader.result.split(',')[1] ?? '');
                };
                reader.readAsDataURL(file);
                event.target.value = '';
              }}
              className="hidden"
            />
          </section>

          <section className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <label htmlFor="first-run-username" className="mb-2 block text-sm font-medium text-[var(--tema-text-secondary)]">
              <User className="mr-2 inline h-4 w-4" />{t('Nome de usuário')}
            </label>
            <input
              id="first-run-username"
              type="text"
              autoComplete="nickname"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 py-3 text-lg text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
              placeholder={t('Digite seu nome')}
            />
            <p className="mb-3 mt-5 text-center text-sm font-medium text-[var(--tema-text-secondary)]">{t('Ou escolha um emoji')}</p>
            <div className="grid grid-cols-7 gap-2">
              {AVATARES.map((emoji) => (
                <button
                  type="button"
                  key={emoji}
                  onClick={() => setAvatar(emoji)}
                  aria-label={`${t('Usar avatar')} ${emoji}`}
                  aria-pressed={avatar === emoji}
                  className={`relative grid aspect-square place-items-center rounded-full border text-2xl transition hover:-translate-y-0.5 ${
                    avatar === emoji
                      ? 'border-[var(--tema-accent)] bg-[var(--tema-accent)]/15'
                      : 'border-white/10 bg-white/[0.035] hover:border-white/25'
                  }`}
                >
                  {emoji}
                  {avatar === emoji && <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[var(--tema-accent)] p-0.5 text-white" />}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--tema-text-primary)]">
                <Palette className="h-4 w-4" />{t('Tema')}
              </label>
              <span className="text-xs text-[var(--tema-text-secondary)]">{temaClaro ? t('Tema claro') : t('Tema escuro')}</span>
            </div>
            <div className="grid grid-cols-2 rounded-2xl bg-black/20 p-1">
              <button
                type="button"
                onClick={() => setTemaClaro(true)}
                aria-pressed={temaClaro}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${temaClaro ? 'bg-[var(--tema-accent)] text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
              >
                <Sun className="h-4 w-4" />{t('Claro')}
              </button>
              <button
                type="button"
                onClick={() => setTemaClaro(false)}
                aria-pressed={!temaClaro}
                className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${!temaClaro ? 'bg-[var(--tema-accent)] text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}
              >
                <Moon className="h-4 w-4" />{t('Escuro')}
              </button>
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--tema-text-primary)]">
                <Palette className="h-4 w-4" />{t('Cor do tema / fundo')}
              </label>
              <span className="text-xs text-[var(--tema-text-secondary)]">{t('Selecione a cor de fundo e o tema de destaque')}</span>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {CORES.map((cor) => (
                <button
                  type="button"
                  key={cor.nome}
                  onClick={() => setCorSelecionada(cor.valor)}
                  className={`aspect-square rounded-full border-2 transition-all ${
                    corSelecionada === cor.valor
                      ? 'scale-105 ring-2 ring-[var(--tema-text-primary)] ring-offset-2 ring-offset-[var(--tema-surface)]'
                      : 'border-[var(--tema-border)] hover:border-[var(--tema-text-secondary)]'
                  }`}
                  style={{ backgroundColor: cor.valor, borderColor: cor.valor }}
                  title={t(cor.nome)}
                  aria-label={t(cor.nome)}
                  aria-pressed={corSelecionada === cor.valor}
                />
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-[var(--tema-text-primary)]">
              <Globe className="h-4 w-4" />{t('Idioma')}
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setIdioma('pt-BR');
                  definirIdioma('pt-BR');
                }}
                aria-pressed={idioma === 'pt-BR'}
                className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  idioma === 'pt-BR'
                    ? 'bg-[var(--tema-accent)] text-white'
                    : 'border border-[var(--tema-border)] bg-[var(--tema-surface-elevado)] text-[var(--tema-text-secondary)] hover:opacity-80'
                }`}
              >
                Português
              </button>
              <button
                type="button"
                onClick={() => {
                  setIdioma('en-US');
                  definirIdioma('en-US');
                }}
                aria-pressed={idioma === 'en-US'}
                className={`rounded-xl px-4 py-2.5 text-sm transition-colors ${
                  idioma === 'en-US'
                    ? 'bg-[var(--tema-accent)] text-white'
                    : 'border border-[var(--tema-border)] bg-[var(--tema-surface-elevado)] text-[var(--tema-text-secondary)] hover:opacity-80'
                }`}
              >
                English
              </button>
            </div>
          </section>

          <div className="flex flex-col justify-end gap-3 lg:col-start-2">
            {erroSalvar && (
              <p role="alert" className="break-words rounded-xl border border-rose-400/20 bg-rose-500/10 p-3 text-sm text-rose-200">
                {erroSalvar}
              </p>
            )}
            <button
              type="button"
              onClick={() => void concluir()}
              disabled={enviando}
              className="flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--tema-accent)] px-5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <CheckCircle2 className="h-4 w-4" />
              {enviando ? t('Salvando…') : t('Concluir configuração')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FirstRun;
