import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import { Palette, CheckCircle2, Sun, Moon, Globe } from 'lucide-react';
import { aplicarTema } from '../utils/theme';
import type { TemaCor } from '../types/models';
import { useI18n } from '../utils/i18n';

interface CorOpcao {
  nome: string;
  valor: string;
  claro: string;
  escuro: string;
}

const CORES: CorOpcao[] = [
  { nome: 'Verde-água', valor: '#0E4F4A', claro: '#E0F2F1', escuro: '#0E4F4A' },
  { nome: 'Azul', valor: '#1E3A5F', claro: '#E3F2FD', escuro: '#1E3A5F' },
  { nome: 'Lilás', valor: '#3B2366', claro: '#F3E5F5', escuro: '#3B2366' },
  { nome: 'Rosa', valor: '#6B1E3A', claro: '#FCE4EC', escuro: '#6B1E3A' },
  { nome: 'Pêssego', valor: '#7A4A12', claro: '#FFF3E0', escuro: '#7A4A12' },
  { nome: 'Verde', valor: '#14532D', claro: '#E8F5E9', escuro: '#14532D' },
  { nome: 'Amarelo', valor: '#5C4A0E', claro: '#FFFDE7', escuro: '#5C4A0E' },
  { nome: 'Cinza', valor: '#33393B', claro: '#EEEEEE', escuro: '#33393B' },
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

export function FirstRun() {
  const navigate = useNavigate();
  const { salvarPerfil, definirIdioma } = useMangoStore();
  const { t } = useI18n();

  const [temaClaro, setTemaClaro] = useState<boolean>(false);
  const [temaCor, setTemaCor] = useState<TemaCor>('soft-pastel');
  const [corSelecionada, setCorSelecionada] = useState<string>(CORES[0].valor);
  const [idioma, setIdioma] = useState<'pt-BR' | 'en-US'>('pt-BR');
  const [enviando, setEnviando] = useState<boolean>(false);

  const corAtiva = CORES.find((c) => c.valor === corSelecionada);

  // Quando a cor de fundo muda, atualiza automaticamente o temaCor
  useEffect(() => {
    setTemaCor(corParaTemaCor(corAtiva?.valor ?? '#0e4f4a'));
  }, [corAtiva?.valor]);

  // Aplica o tema imediatamente ao mudar
  useEffect(() => {
    aplicarTema(temaClaro, temaCor, corAtiva?.valor ?? '#0e4f4a');
  }, [temaClaro, temaCor, corAtiva?.valor]);

  const concluir = async () => {
    setEnviando(true);
    await salvarPerfil({
      temaClaro,
      corFundo: parseInt(corAtiva?.valor.replace('#', '') || '0e4f4a', 16),
      temaCor,
      idioma,
      username: '',
      avatar: '',
    });
    setEnviando(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-6 sm:p-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[var(--tema-accent)]/20 border border-[var(--tema-accent)]/30 mb-4">
            <CheckCircle2 className="w-8 h-8 text-[var(--tema-accent)]" />
          </div>
          <h1 className="text-2xl font-bold">{t('Bem-vindo ao Mango')}</h1>
          <p className="mt-2 text-gray-400">
            {t('Vamos configurar o seu perfil antes de começar.')}
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Palette className="w-4 h-4" />
                {t('Tema')}
              </label>
              <button
                onClick={() => setTemaClaro((v) => !v)}
                className={`rounded-lg p-1.5 transition-colors ${
                  temaClaro
                    ? 'bg-gray-700 text-yellow-300 border border-yellow-500/30'
                    : 'bg-gray-800 text-[var(--tema-accent)] border border-[var(--tema-accent)]/30'
                }`}
                title={t('Alternar claro/escuro')}
              >
                {temaClaro ? (
                  <Sun className="w-4 h-4" />
                ) : (
                  <Moon className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500">
              {temaClaro ? t('Tema claro') : t('Tema escuro')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {t('Cor de fundo')}
            </label>
            <div className="grid grid-cols-4 gap-2">
              {CORES.map((c) => (
                <button
                  key={c.nome}
                  onClick={() => setCorSelecionada(c.valor)}
                  className={`h-10 rounded-lg border-2 transition-all ${
                    corSelecionada === c.valor
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-gray-900 scale-105'
                      : 'border-gray-700 hover:border-gray-500'
                  }`}
                  style={{
                    backgroundColor: c.claro,
                    borderColor: c.escuro,
                  }}
                  title={t(c.nome)}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                <Globe className="w-4 h-4" />
                Idioma
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
                    : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
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
                    : 'bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700'
                }`}
              >
                English
              </button>
            </div>
          </div>
        </div>

        <button
          onClick={concluir}
          disabled={enviando}
          className="w-full py-3 rounded-lg bg-[var(--tema-accent)] hover:bg-[var(--tema-accent)]/90 disabled:opacity-50 text-sm font-medium flex items-center justify-center gap-2 transition-colors"
        >
          {enviando ? t('Salvando…') : t('Concluir configuração')}
        </button>
      </div>
    </div>
  );
}

export default FirstRun;
