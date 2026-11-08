import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import {
  BandeiraCartao,
  BANDEIRA_LABELS,
} from '../types/models';
import { useI18n } from '../utils/i18n';
import { CardNetworkLogo } from '../components/CardNetworkLogo';
import { cardBackgroundForBank } from '../utils/card-appearance';

const BANCOS = [
  'Itaú',
  'Nubank',
  'Bradesco',
  'Santander',
  'Banco do Brasil',
  'Caixa',
  'Inter',
  'C6 Bank',
  'Banco Pan',
  'PicPay',
  'Sicredi',
  'Sicoob',
  'BTG Pactual',
];

const OUTRO_BANCO = 'outro';

export function CartaoForm() {
  const { idioma, t } = useI18n();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const modoEdicao = !!params.id;

  const { cartoes, adicionarCartao, editarCartao } = useMangoStore();

  const cartaoExistente = cartoes.find(
    (c) => c.id === Number(params.id),
  );

  const [banco, setBanco] = useState(
    cartaoExistente?.banco ?? '',
  );
  const [bancoSelecionado, setBancoSelecionado] = useState(() => {
    const existente = cartaoExistente?.banco;
    return existente && BANCOS.includes(existente) ? existente : existente ? OUTRO_BANCO : '';
  });
  const [bandeira, setBandeira] = useState<BandeiraCartao>(
    cartaoExistente?.bandeira ?? BandeiraCartao.visa,
  );
  const [nome, setNome] = useState(cartaoExistente?.nome ?? '');
  const [diaFechamento, setDiaFechamento] = useState(
    cartaoExistente?.diaFechamento ?? 1,
  );
  const [diaPagamento, setDiaPagamento] = useState(
    cartaoExistente?.diaPagamento ?? 10,
  );
  const [limiteCentavos, setLimiteCentavos] = useState(
    cartaoExistente?.limiteCentavos ?? 0,
  );
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);

  const limiteFormatado = new Intl.NumberFormat(idioma, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(limiteCentavos / 100);

  const salvar = async () => {
    setErro(null);
    const bancoFinal = bancoSelecionado === OUTRO_BANCO ? banco.trim() : bancoSelecionado;
    if (!bancoFinal) {
      setErro(t('Informe o banco'));
      return;
    }
    if (!nome.trim()) {
      setErro(t('Informe o nome do cartão'));
      return;
    }
    if (diaFechamento < 1 || diaFechamento > 31) {
      setErro(t('Dia de fechamento inválido'));
      return;
    }
    if (diaPagamento < 1 || diaPagamento > 31) {
      setErro(t('Dia de pagamento inválido'));
      return;
    }

    const input = {
      banco: bancoFinal,
      bandeira,
      nome: nome.trim(),
      diaFechamento,
      diaPagamento,
      limiteCentavos: limiteCentavos > 0 ? limiteCentavos : undefined,
    };

    try {
      setEnviando(true);
      if (modoEdicao && cartaoExistente) {
        await editarCartao({ ...cartaoExistente, ...input });
      } else {
        await adicionarCartao(input);
      }
      setEnviando(false);
      navigate('/cartoes');
    } catch (e) {
      setEnviando(false);
      setErro(t('Erro ao salvar cartão'));
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate('/cartoes')}
            className="px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm"
          >
            {t('Voltar')}
          </button>
          <h1 className="text-2xl font-bold">
            {modoEdicao ? t('Editar cartão') : t('Novo cartão')}
          </h1>
        </div>

        {erro && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 mb-4">
            <div className="text-sm text-red-400">{erro}</div>
          </div>
        )}

        <div className="relative mx-auto mb-6 flex aspect-[1.586/1] w-full max-w-[28rem] items-end overflow-hidden rounded-[1.7rem] p-5 text-white shadow-[0_16px_38px_rgba(70,24,150,.24)] sm:p-7" style={{ background: cardBackgroundForBank(banco) }}>
          <div className="pointer-events-none absolute -right-10 -top-20 h-56 w-56 rounded-full border border-white/10" />
          <div className="pointer-events-none absolute -right-2 -top-12 h-40 w-40 rounded-full border border-white/[0.08]" />
          <div className="absolute right-5 top-5 grid h-12 w-[4.75rem] place-items-center rounded-lg bg-white shadow-lg sm:right-7 sm:top-7">
            <CardNetworkLogo network={bandeira} className="h-10 w-16" />
          </div>
          <div className="relative min-w-0">
            <p className="text-sm font-semibold text-white/65">{banco || t('Banco')}</p>
            <p className="mt-1 truncate text-xl font-bold sm:text-2xl">{nome || t('Nome do cartão')}</p>
            <p className="mt-3 text-xs text-white/75">
              {t('Fecha em')} {diaFechamento} <span className="mx-1">·</span> {t('Pagamento em')} {diaPagamento}
            </p>
          </div>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            salvar();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5 md:rounded-3xl md:border md:border-white/[0.07] md:bg-[var(--tema-surface)] md:p-8"
        >
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('Banco')}
            </label>
            <select
              value={bancoSelecionado}
              onChange={(e) => {
                const selecionado = e.target.value;
                setBancoSelecionado(selecionado);
                if (selecionado === OUTRO_BANCO) {
                  if (bancoSelecionado !== OUTRO_BANCO) setBanco('');
                } else {
                  setBanco(selecionado);
                }
              }}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:border-[var(--tema-accent)] focus:outline-none"
            >
              <option value="">{t('Selecione o banco')}</option>
              {BANCOS.map((opcao) => (
                <option key={opcao} value={opcao}>{t(opcao)}</option>
              ))}
              <option value={OUTRO_BANCO}>{t('Outro')}</option>
            </select>
            {bancoSelecionado === OUTRO_BANCO && (
              <input
                type="text"
                value={banco}
                onChange={(e) => setBanco(e.target.value)}
                placeholder={t('Digite o nome do banco')}
                className="mt-3 w-full rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm focus:border-[var(--tema-accent)] focus:outline-none"
                autoFocus
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('Bandeira')}
            </label>
            <select
              value={bandeira}
              onChange={(e) => setBandeira(e.target.value as BandeiraCartao)}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[var(--tema-accent)] text-sm"
            >
              {Object.values(BandeiraCartao).map((b) => (
                <option key={b} value={b}>
                  {t(BANDEIRA_LABELS[b])}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('Nome do cartão')}
            </label>
            <input
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder={t('Ex: Cartão principal')}
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[var(--tema-accent)] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('Dia fechamento')}
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaFechamento}
                onChange={(e) => setDiaFechamento(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[var(--tema-accent)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">
                {t('Dia pagamento')}
              </label>
              <input
                type="number"
                min={1}
                max={31}
                value={diaPagamento}
                onChange={(e) => setDiaPagamento(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:border-[var(--tema-accent)] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              {t('Limite (R$)')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
                {idioma === 'pt-BR' ? 'R$' : '$'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={limiteFormatado}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setLimiteCentavos(parseInt(digits || '0', 10));
                }}
                placeholder={idioma === 'pt-BR' ? '0,00' : '0.00'}
                className="w-full rounded-lg border border-gray-700 bg-gray-800 py-2 pl-9 pr-3 text-sm focus:border-[var(--tema-accent)] focus:outline-none"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2 md:col-span-2 md:justify-end">
            <button
              type="button"
              onClick={() => navigate('/cartoes')}
              className="flex-1 py-2.5 rounded-lg bg-gray-800 border border-gray-700 hover:bg-gray-700 text-sm font-medium"
            >
              {t('Cancelar')}
            </button>
            <button
              type="submit"
              disabled={enviando}
              className="flex-1 py-2.5 rounded-lg bg-[var(--tema-accent)] hover:bg-[var(--tema-accent)]/90 disabled:opacity-50 text-sm font-medium"
            >
              {enviando ? t('Salvando…') : modoEdicao ? t('Salvar alterações') : t('Adicionar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CartaoForm;
