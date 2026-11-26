import { Link } from 'react-router-dom';
import { useI18n } from '../utils/i18n';

export function TermosDeServico() {
  const { t } = useI18n();

  return (
    <main className="grid min-h-screen place-items-center bg-background px-6 py-12 text-foreground sm:p-12">
      <section className="w-full max-w-3xl rounded-[2rem] border border-[var(--tema-border)] bg-[var(--tema-surface)] p-8 text-center shadow-2xl sm:p-12">
        <h1 className="mt-3 text-2xl font-semibold tracking-tight">{t('Termos de Serviço')}</h1>
        <p className="mt-4 max-w-lg mx-auto text-sm leading-relaxed text-[var(--tema-text-secondary)]">
          {t('Ao utilizar o Mango, você concorda com os seguintes termos de serviço.')}
        </p>
        <div className="mt-6 overflow-y-auto max-h-[40vh] rounded-xl border border-[var(--tema-border)] bg-[var(--tema-input)] p-4 text-sm leading-relaxed text-[var(--tema-text-primary)] text-left">
          <h2 className="text-sm font-semibold mb-2">{t('1. Aceitação dos termos')}</h2>
          <p>{t('Ao acessar ou usar o Mango, você concorda em ficar vinculado a estes Termos de Serviço.')}</p>
          <h2 className="text-sm font-semibold mt-4 mb-2">{t('2. Uso do aplicativo')}</h2>
          <p>{t('O Mango é um aplicativo de controle de gastos e receitas. Você é responsável por manter a confidencialidade de suas credenciais de acesso.')}</p>
          <h2 className="text-sm font-semibold mt-4 mb-2">{t('3. Dados e privacidade')}</h2>
          <p>{t('Seus dados financeiros são armazenados de forma segura. Consulte nossa Política de Privacidade para mais informações.')}</p>
          <h2 className="text-sm font-semibold mt-4 mb-2">{t('4. Isenção de responsabilidade')}</h2>
          <p>{t('O aplicativo é fornecido "no estado em que se encontra", sem garantias de qualquer tipo.')}</p>
          <h2 className="text-sm font-semibold mt-4 mb-2">{t('5. Alterações aos termos')}</h2>
          <p>{t('Podemos atualizar estes termos periodicamente. Recomendamos que você os revise com frequência.')}</p>
        </div>
        <div className="mt-8">
          <Link to="/" className="inline-flex items-center gap-2 rounded-xl border border-[var(--tema-border)] px-4 py-2 text-sm font-semibold text-[var(--tema-text-primary)] transition hover:bg-white/[0.04]">
            {t('Voltar ao início')}
          </Link>
        </div>
      </section>
    </main>
  );
}

export default TermosDeServico;