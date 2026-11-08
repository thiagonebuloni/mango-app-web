import { useMangoStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import { useI18n } from '../utils/i18n';
import { localAiService } from '../services/local-ai';

export function Diagnostico() {
  const navigate = useNavigate();
  const {
    despesas,
    cartoes,
    perfil,
    seguranca,
    tentativas,
    syncStatus,
    syncError,
    sincronizarAgora,
  } = useMangoStore();
  const { t } = useI18n();
  const statusIa = localAiService.getStatus();

  const info = [
    { label: t('Despesas'), value: String(despesas.length) },
    { label: t('Cartões'), value: String(cartoes.length) },
    { label: t('Perfil'), value: perfil ? t('Configurado') : t('Sem perfil') },
    { label: t('PIN ativo'), value: seguranca?.pinAtivo ? t('Sim') : t('Não') },
    { label: t('Tentativas PIN'), value: String(tentativas.contador) },
    {
      label: t('IA local'),
      value: statusIa.available
        ? t('Disponível')
        : statusIa.simulationAvailable
          ? t('Simulação disponível; modelo não executado')
          : t('Indisponível no navegador'),
    },
    {
      label: t('Armazenamento'),
      value: 'IndexedDB (mango_app_web)',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/')}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm"
          >
            {t('Voltar')}
          </button>
          <h1 className="text-2xl font-bold">{t('Diagnóstico')}</h1>
        </div>

        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5 mb-6">
          <h2 className="text-lg font-semibold mb-4">{t('Estado do app')}</h2>
          <div className="space-y-2">
            {info.map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0"
              >
                <span className="text-gray-400">{item.label}</span>
                <span className="font-medium">{item.value}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-gray-800 bg-gray-900/40 p-5">
          <h2 className="text-lg font-semibold mb-4">{t('Log de falhas')}</h2>
          <div className="rounded-lg border border-gray-800 bg-black/20 p-4">
            <p className="text-sm font-medium text-gray-200">
              {t(syncStatus === 'local' ? 'Somente neste dispositivo' : syncStatus === 'synced' ? 'Sincronizado com Supabase' : syncStatus === 'syncing' ? 'Sincronizando…' : syncStatus === 'pending' ? 'Sincronização pendente' : 'Erro de sincronização')}
            </p>
            {syncError
              ? <p role="alert" className="mt-2 break-words text-sm text-rose-300">{syncError}</p>
              : <p className="mt-2 text-sm text-gray-500">{t('Nenhum erro de sincronização registrado.')}</p>}
            {syncStatus === 'pending' && (
              <button
                type="button"
                onClick={() => void sincronizarAgora()}
                className="mt-3 text-sm font-semibold text-[var(--tema-accent)] hover:underline"
              >
                {t('Sincronizar agora')}
              </button>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

export default Diagnostico;
