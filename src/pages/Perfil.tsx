import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import { Palette, Sun, Moon, Globe, Shield, User, Camera, Check, Smile } from 'lucide-react';
import { aplicarTema } from '../utils/theme';
import type { TemaCor } from '../types/models';
import { useI18n } from '../utils/i18n';

interface CorOpcao {
  nome: string;
  valor: string;
}

const CORES: CorOpcao[] = [
  { nome: 'Verde-água', valor: '#0E4F4A' },
  { nome: 'Azul', valor: '#1E3A5F' },
  { nome: 'Lilás', valor: '#3B2366' },
  { nome: 'Rosa', valor: '#6B1E3A' },
  { nome: 'Pêssego', valor: '#7A4A12' },
  { nome: 'Verde', valor: '#14532D' },
  { nome: 'Amarelo', valor: '#5C4A0E' },
  { nome: 'Cinza', valor: '#33393B' },
];

const AVATARES = [
  '🙂', '😀', '😄', '😁', '😎', '🤓', '🥳', '🤩', '😇', '🥰', '🤔', '😴', '🤗', '😺',
  '🐱', '🐶', '🦊', '🐼', '🦁', '🐸', '🐵', '🐰', '🐻', '🐨', '🐯', '🐮', '🐷', '🐧',
  '🌟', '✨', '🌈', '☀️', '🌙', '🍀', '🌻', '🌸', '🍓', '🍉', '🍕', '☕', '🎵', '⚽',
];

// Mapeia a cor de fundo selecionada para o nome do tema mais próximo
function corParaTemaCor(corHex: string): TemaCor {
  const c = corHex.toLowerCase();
  const mapa: Record<string, TemaCor> = {
    '#0e4f4a': 'forest-green',
    '#1e3a5f': 'ocean-blue',
    '#3b2366': 'lavender-mist',
    '#6b1e3a': 'sunset-warm',
    '#7a4a12': 'sunset-warm',
    '#14532d': 'forest-green',
    '#5c4a0e': 'sunset-warm',
    '#33393b': 'soft-pastel',
  };
  return mapa[c] ?? 'soft-pastel';
}

export function Perfil() {
  const navigate = useNavigate();
  const { perfil, salvarPerfil, seguranca, salvarSeguranca, definirIdioma } = useMangoStore();
  const { t } = useI18n();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [emojiKeyboardOpen, setEmojiKeyboardOpen] = useState(false);

  const [temaClaro, setTemaClaro] = useState<boolean>(
    perfil?.temaClaro ?? false,
  );
  // Se o perfil antigo não tem temaCor, derivamos da corFundo
  const temaCorInicial: TemaCor =
    perfil?.temaCor ??
    (perfil?.corFundo
      ? corParaTemaCor(`#${(perfil.corFundo & 0xffffff).toString(16).padStart(6, '0')}`)
      : 'soft-pastel');
  const [temaCor, setTemaCor] = useState<TemaCor>(temaCorInicial);
  const [corSelecionada, setCorSelecionada] = useState<string>(
    perfil
      ? `#${(perfil.corFundo & 0xffffff).toString(16).padStart(6, '0')}`
      : CORES[0].valor,
  );
  const [idioma, setIdioma] = useState<'pt-BR' | 'en-US'>(
    perfil?.idioma ?? 'pt-BR',
  );
  const [username, setUsername] = useState<string>(perfil?.username ?? '');
  const [avatar, setAvatarBase64] = useState<string>(perfil?.avatar ?? '');
  const [pinAtivo, setPinAtivo] = useState<boolean>(
    seguranca?.pinAtivo ?? false,
  );
  const [bloqueioAtivo, setBloqueioAtivo] = useState<boolean>(
    seguranca?.bloqueioAtivo ?? false,
  );
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erroSalvar, setErroSalvar] = useState<string | null>(null);

  const corAtiva = CORES.find((c) => c.valor === corSelecionada);
  const corFundoHex = corAtiva?.valor ?? corSelecionada;
  const avatarEhImagem = avatar.length > 0 && !/^[\p{Emoji}\s]+$/u.test(avatar);

  useEffect(() => {
    if (!perfil) return;
    const corSalva = `#${(perfil.corFundo & 0xffffff).toString(16).padStart(6, '0')}`;
    setTemaClaro(perfil.temaClaro);
    setTemaCor(perfil.temaCor ?? corParaTemaCor(corSalva));
    setCorSelecionada(corSalva);
    setIdioma(perfil.idioma ?? 'pt-BR');
    setUsername(perfil.username ?? '');
    setAvatarBase64(perfil.avatar ?? '');
  }, [perfil]);

  useEffect(() => {
    if (!seguranca) return;
    setPinAtivo(seguranca.pinAtivo);
    setBloqueioAtivo(seguranca.bloqueioAtivo);
  }, [seguranca]);

  // Aplica o tema ao montar e sempre que mudar temaClaro, temaCor ou corSelecionada
  useEffect(() => {
    aplicarTema(temaClaro, temaCor, corFundoHex);
  }, [temaClaro, temaCor, corFundoHex]);

  const salvar = async () => {
    setErroSalvar(null);
    setEnviando(true);
    try {
      await salvarPerfil({
        temaClaro,
        corFundo: parseInt(corFundoHex.replace('#', ''), 16),
        temaCor,
        idioma,
        username,
        avatar,
      });
      await salvarSeguranca({
        pinAtivo,
        pinHash: seguranca?.pinHash,
        bloqueioAtivo,
      });
      navigate('/');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      setErroSalvar(t('Erro ao salvar perfil'));
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-5rem)] bg-background px-4 pb-32 pt-5 text-foreground sm:px-6 sm:pt-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-[var(--tema-text-primary)]">{t('Editar perfil')}</h2>
          <p className="mt-2 text-sm text-[var(--tema-text-secondary)]">{t('Ajuste seu nome, avatar e cor de fundo.')}</p>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2 lg:items-start lg:gap-6">
          <section className="rounded-[1.8rem] border border-white/[0.06] bg-[color-mix(in_srgb,var(--tema-accent)_60%,#21180f)] px-5 py-7 text-center shadow-[0_16px_38px_rgba(0,0,0,.18)]">
            <div className="relative mx-auto h-32 w-32">
              <button
                type="button"
                onClick={() => avatarInputRef.current?.click()}
                className="group grid h-full w-full place-items-center overflow-hidden rounded-full border-[5px] border-[#151515] bg-[var(--tema-surface-elevado)] text-6xl shadow-xl"
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
            <p className="mt-1 text-2xl font-bold text-white">{username || t('Seu nome')}</p>
            <input
              ref={avatarInputRef}
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = () => {
                  if (typeof reader.result === 'string') {
                    setAvatarBase64(reader.result.split(',')[1] ?? '');
                  }
                };
                reader.readAsDataURL(file);
                event.target.value = '';
              }}
              className="hidden"
            />
          </section>

          <section className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <label htmlFor="username" className="mb-2 block text-sm font-medium text-[var(--tema-text-secondary)]">
              <User className="mr-2 inline h-4 w-4" />{t('Nome de usuário')}
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 py-3 text-lg text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
              placeholder={t('Digite seu nome')}
            />
            <button
              type="button"
              onClick={() => setEmojiKeyboardOpen((open) => !open)}
              aria-expanded={emojiKeyboardOpen}
              aria-controls="avatar-emoji-keyboard"
              className="mb-3 mt-5 flex w-full items-center justify-center gap-2 text-sm font-medium text-[var(--tema-text-secondary)] transition hover:text-[var(--tema-text-primary)]"
            >
              <Smile className="h-4 w-4" />{t(emojiKeyboardOpen ? 'Fechar teclado de emojis' : 'Abrir teclado de emojis')}
            </button>
            {emojiKeyboardOpen && (
              <div id="avatar-emoji-keyboard" role="group" aria-label={t('Teclado de emojis')} className="grid grid-cols-7 gap-2 rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-input)] p-3">
                {AVATARES.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    onClick={() => {
                      setAvatarBase64(emoji);
                      setEmojiKeyboardOpen(false);
                    }}
                    aria-label={`${t('Usar avatar')} ${emoji}`}
                    aria-pressed={avatar === emoji}
                    className={`relative grid aspect-square place-items-center rounded-xl border text-2xl transition hover:-translate-y-0.5 ${
                      avatar === emoji
                        ? 'border-[var(--tema-accent)] bg-[var(--tema-accent)]/15'
                        : 'border-transparent hover:border-white/20 hover:bg-white/[0.05]'
                    }`}
                  >
                    {emoji}
                    {avatar === emoji && <Check className="absolute -right-1 -top-1 h-4 w-4 rounded-full bg-[var(--tema-accent)] p-0.5 text-white" />}
                  </button>
                ))}
              </div>
            )}
            <label htmlFor="avatar-emoji" className="mb-2 mt-5 block text-sm font-medium text-[var(--tema-text-secondary)]">
              <Smile className="mr-2 inline h-4 w-4" />{t('Digite ou cole um emoji')}
            </label>
            <input
              id="avatar-emoji"
              type="text"
              inputMode="text"
              autoComplete="off"
              value={avatarEhImagem ? '' : avatar}
              onChange={(event) => {
                const emoji = Array.from(event.target.value)
                  .filter((character) => /[\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u200D\p{Emoji_Modifier}]/u.test(character))
                  .join('');
                setAvatarBase64(emoji);
              }}
              className="w-full rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] px-4 py-3 text-2xl text-[var(--tema-text-primary)] outline-none transition focus:border-[var(--tema-accent)]"
              placeholder="🙂"
              aria-label={t('Digite ou cole um emoji')}
            />
            <p className="mt-2 text-xs text-[var(--tema-text-secondary)]">{t('No celular, abra o teclado de emojis para escolher.')}</p>
          </section>

          {/* Tema (claro/escuro) */}
          <div className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <div className="mb-4 flex items-center justify-between">
              <label className="text-sm font-medium text-[var(--tema-text-primary)] flex items-center gap-2">
                <Palette className="w-4 h-4" /> {t('Tema')}
              </label>
              <span className="text-xs text-[var(--tema-text-secondary)]">{temaClaro ? t('Tema claro') : t('Tema escuro')}</span>
            </div>
            <div className="grid grid-cols-2 rounded-2xl bg-black/20 p-1">
              <button type="button" onClick={() => setTemaClaro(true)} aria-pressed={temaClaro} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${temaClaro ? 'bg-[var(--tema-accent)] text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
                <Sun className="h-4 w-4" />{t('Claro')}
              </button>
              <button type="button" onClick={() => setTemaClaro(false)} aria-pressed={!temaClaro} className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm transition ${!temaClaro ? 'bg-[var(--tema-accent)] text-white shadow-lg' : 'text-stone-400 hover:text-white'}`}>
                <Moon className="h-4 w-4" />{t('Escuro')}
              </button>
            </div>
          </div>

          {/* Cor do tema / fundo (unificado) */}
          <div className="rounded-3xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5 sm:p-6">
            <div className="mb-4 flex items-start justify-between gap-4">
              <label className="text-sm font-medium text-[var(--tema-text-primary)] flex items-center gap-2">
                <Palette className="w-4 h-4" /> {t('Cor do tema / fundo')}
              </label>
              <span className="text-xs text-[var(--tema-text-secondary)]">
                {t('Selecione a cor de fundo e o tema de destaque')}
              </span>
            </div>
            <div className="grid grid-cols-4 gap-3 sm:grid-cols-8">
              {CORES.map((c) => (
                <button
                  key={c.nome}
                  onClick={() => {
                    setCorSelecionada(c.valor);
                    setTemaCor(corParaTemaCor(c.valor));
                  }}
                  className={`aspect-square rounded-full border-2 transition-all ${
                    corSelecionada === c.valor
                      ? 'ring-2 ring-[var(--tema-text-primary)] ring-offset-2 ring-offset-[var(--tema-surface)] scale-105'
                      : 'border-[var(--tema-border)] hover:border-[var(--tema-text-secondary)]'
                  }`}
                  style={{
                    backgroundColor: c.valor,
                    borderColor: c.valor,
                  }}
                  title={t(c.nome)}
                  aria-label={t(c.nome)}
                  aria-pressed={corSelecionada === c.valor}
                />
              ))}
            </div>
          </div>

          {/* Idioma */}
          <div className="rounded-xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-[var(--tema-text-primary)] flex items-center gap-2">
                <Globe className="w-4 h-4" /> {t('Idioma')}
              </label>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setIdioma('pt-BR');
                  definirIdioma('pt-BR');
                }}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  idioma === 'pt-BR'
                    ? 'bg-[var(--tema-accent)] text-white'
                    : 'bg-[var(--tema-surface-elevado)] border border-[var(--tema-border)] text-[var(--tema-text-secondary)] hover:opacity-80'
                }`}
              >
                Português
              </button>
              <button
                onClick={() => {
                  setIdioma('en-US');
                  definirIdioma('en-US');
                }}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  idioma === 'en-US'
                    ? 'bg-[var(--tema-accent)] text-white'
                    : 'bg-[var(--tema-surface-elevado)] border border-[var(--tema-border)] text-[var(--tema-text-secondary)] hover:opacity-80'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Segurança */}
          <div id="seguranca" className="rounded-xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-4 h-4 text-[var(--tema-text-secondary)]" />
              <h2 className="text-sm font-medium text-[var(--tema-text-primary)]">{t('Segurança')}</h2>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--tema-text-primary)]">{t('PIN ativo')}</span>
              <button
                onClick={() => setPinAtivo((v) => !v)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  pinAtivo ? 'bg-[var(--tema-accent)] text-white' : 'bg-[var(--tema-surface-elevado)] border border-[var(--tema-border)] text-[var(--tema-text-secondary)] hover:opacity-80'
                }`}
              >
                {pinAtivo ? t('Sim') : t('Não')}
              </button>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[var(--tema-text-primary)]">{t('Bloqueio ativo')}</span>
              <button
                onClick={() => setBloqueioAtivo((v) => !v)}
                className={`px-3 py-1.5 rounded text-sm transition-colors ${
                  bloqueioAtivo ? 'bg-[var(--tema-accent)] text-white' : 'bg-[var(--tema-surface-elevado)] border border-[var(--tema-border)] text-[var(--tema-text-secondary)] hover:opacity-80'
                }`}
              >
                {bloqueioAtivo ? t('Sim') : t('Não')}
              </button>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 max-w-3xl lg:mt-8">
          {erroSalvar && (
            <p role="alert" className="mb-3 text-sm text-red-500">
              {erroSalvar}
            </p>
          )}
          <button
            onClick={salvar}
            disabled={enviando}
            className="w-full py-3 rounded-lg bg-[var(--tema-accent)] hover:bg-[var(--tema-accent)]/90 disabled:opacity-50 text-sm font-medium"
          >
            {enviando ? t('Salvando…') : t('Salvar configurações')}
          </button>
        </div>
      </div>
    </div>
  );
}
export default Perfil;
