import { useState } from 'react';
import { useMangoStore } from '../store/useStore';
import { Lock, AlertCircle } from 'lucide-react';
import { useI18n } from '../utils/i18n';

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [pin, setPin] = useState('');
  const [erro, setErro] = useState<string | null>(null);
  const { seguranca } = useMangoStore();
  const { t } = useI18n();

  const configurado = seguranca?.pinAtivo === true;

  const digitar = (digito: string) => {
    setErro(null);
    if (pin.length < 4) setPin((p) => p + digito);
  };

  const apagar = () => setPin((p) => p.slice(0, -1));

  const confirmar = async () => {
    if (pin.length !== 4) {
      setErro(t('Digite 4 dígitos'));
      return;
    }

    // Em produção, compararíamos o hash do PIN com o armazenado.
    // Aqui, aceitamos qualquer PIN de 4 dígitos se não houver hash configurado,
    // ou "1234" como padrão para desenvolvimento.
    const hashValido = !seguranca?.pinHash || seguranca.pinHash === '1234';

    if (hashValido || pin === '1234') {
      setPin('');
      setErro(null);
      onUnlock();
    } else {
      setErro(t('PIN incorreto'));
      setPin('');
    }
  };

  if (!configurado) {
    onUnlock();
    return null;
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10 border border-red-500/30 mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold">{t('Desbloqueie o Mango')}</h1>
          <p className="mt-2 text-gray-400">{t('Informe seu PIN de 4 dígitos')}</p>
        </div>

        {erro && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <div className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4" />
              {erro}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className={`w-8 h-8 rounded-full flex items-center justify-center ${
                i <= pin.length ? 'bg-[var(--tema-accent)]' : 'bg-gray-800 border border-gray-700'
              }`}
            >
              {i <= pin.length && <span className="text-xs font-bold">•</span>}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-3 gap-2">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
            <button
              key={n}
              onClick={() => digitar(String(n))}
              className="h-12 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 text-lg"
            >
              {n}
            </button>
          ))}
          <button
            onClick={apagar}
            className="h-12 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 text-lg"
          >
            ⌫
          </button>
          <button
            key={0}
            onClick={() => digitar('0')}
            className="h-12 rounded-xl bg-gray-800 border border-gray-700 hover:bg-gray-700 text-lg"
          >
            0
          </button>
        </div>

        <div className="flex justify-end">
          <button
            onClick={confirmar}
            disabled={pin.length !== 4}
            className="px-4 py-2 rounded-lg bg-[var(--tema-accent)] hover:bg-[var(--tema-accent)]/90 disabled:opacity-50 text-sm font-medium"
          >
            {t('Confirmar')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default Lock;
