import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMangoStore } from '../store/useStore';
import {
  Category,
  PaymentMethod,
  CATEGORY_DESPESAS,
  CATEGORY_RECEITAS,
  PAYMENT_METHOD_LABELS,
  CATEGORY_LABELS,
} from '../types/models';
import { expandirParcelas } from '../utils/format';
import { ChevronLeft } from 'lucide-react';
import { useI18n } from '../utils/i18n';
import {
  ReceiptOcrError,
  receiptOcrService,
  type ReceiptFileResult,
} from '../services/receipt-ocr';

interface ExpenseInput {
  estabelecimento: string;
  valorCentavos: number;
  categoria: Category;
  formaPagamento: PaymentMethod;
  data: string;
  cartaoId?: number;
  fotoPath?: string;
  observacao?: string;
}

interface DespesaFormProps {
  tipoInicial?: 'despesa' | 'receita';
}

export function DespesaForm({ tipoInicial = 'despesa' }: DespesaFormProps) {
  const { idioma, t } = useI18n();
  const navigate = useNavigate();
  const params = useParams<{ id: string }>();
  const modoEdicao = !!params.id;

  const { despesas, cartoes, cartoesLoading, adicionarDespesa, editarDespesa } = useMangoStore();

  const despesaExistente = despesas.find((d) => d.id === Number(params.id));
  const isReceita = despesaExistente
    ? CATEGORY_RECEITAS.includes(despesaExistente.categoria)
    : tipoInicial === 'receita';
  const categorias = isReceita ? CATEGORY_RECEITAS : CATEGORY_DESPESAS;

  const [estabelecimento, setEstabelecimento] = useState(
    despesaExistente?.estabelecimento ?? ''
  );
  const [valorCentavos, setValorCentavos] = useState(
    despesaExistente?.valorCentavos ?? 0
  );
  const [categoria, setCategoria] = useState<Category>(
    despesaExistente?.categoria ??
      (isReceita ? CATEGORY_RECEITAS[0] : CATEGORY_DESPESAS[0])
  );
  const [formaPagamento, setFormaPagamento] = useState<PaymentMethod>(
    despesaExistente?.formaPagamento ?? PaymentMethod.dinheiro
  );
  const [data, setData] = useState(
    despesaExistente?.data ?? new Date().toISOString().split('T')[0]
  );
  const [cartaoId, setCartaoId] = useState<number | undefined>(
    despesaExistente?.cartaoId
  );
  const [observacao, setObservacao] = useState(
    despesaExistente?.observacao ?? ''
  );
  const [enviando, setEnviando] = useState<boolean>(false);
  const [erro, setErro] = useState<string | null>(null);
  const [arquivoCupom, setArquivoCupom] = useState<ReceiptFileResult | null>(null);
  const [erroCupom, setErroCupom] = useState<string | null>(null);
  const [lendoCupom, setLendoCupom] = useState(false);
  const [progressoOcr, setProgressoOcr] = useState(0);

  const selecionarCupom = async (file: File | undefined) => {
    if (!file) return;
    setErroCupom(null);
    setLendoCupom(true);
    setProgressoOcr(0);
    try {
      const resultado = await receiptOcrService.extractText(file, setProgressoOcr);
      setArquivoCupom(resultado);
      if (resultado.merchant) setEstabelecimento(resultado.merchant);
      if (resultado.totalCents) setValorCentavos(resultado.totalCents);
      if (resultado.date) setData(resultado.date);
      if (resultado.paymentMethod) setFormaPagamento(resultado.paymentMethod);
    } catch (error) {
      setArquivoCupom(null);
      const mensagem = error instanceof ReceiptOcrError
        ? error.code === 'unsupported-file'
          ? 'Selecione um arquivo de imagem.'
          : error.code === 'file-too-large'
            ? 'A imagem do cupom deve ter até 8 MB.'
            : error.code === 'ocr-failed'
              ? 'Não foi possível reconhecer o texto do cupom. Verifique sua conexão e tente novamente.'
            : 'Não foi possível ler o arquivo do cupom.'
        : error instanceof Error
          ? error.message
          : String(error);
      setErroCupom(t(mensagem));
    } finally {
      setLendoCupom(false);
    }
  };

  const valorReais = new Intl.NumberFormat(idioma, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(valorCentavos / 100);
  const podeParcelar =
    !isReceita &&
    formaPagamento === PaymentMethod.credito &&
    estabelecimento.match(/\s\d+\/\d+\s*$/);

  const salvar = async () => {
    setErro(null);
    if (!estabelecimento.trim()) {
      setErro(t(isReceita ? 'Informe a origem' : 'Informe o estabelecimento'));
      return;
    }
    if (!valorCentavos || valorCentavos <= 0) {
      setErro(t('Informe um valor válido'));
      return;
    }

    const input: ExpenseInput = {
      estabelecimento: estabelecimento.trim(),
      valorCentavos,
      categoria,
      formaPagamento,
      data,
      cartaoId,
      observacao: observacao.trim() || undefined,
    };

    try {
      setEnviando(true);

      if (podeParcelar) {
        const parcelas = expandirParcelas(input);
        for (const p of parcelas) {
          await adicionarDespesa({
            estabelecimento: p.estabelecimento,
            valorCentavos: p.valorCentavos,
            categoria,
            formaPagamento,
            data: p.data,
            cartaoId,
            observacao,
          });
        }
      } else {
        await adicionarDespesa(input);
      }

      setEnviando(false);
      navigate('/');
    } catch (error) {
      console.error(`Erro ao salvar ${isReceita ? 'receita' : 'despesa'}:`, error);
      setEnviando(false);
      setErro(t(isReceita ? 'Erro ao salvar receita' : 'Erro ao salvar despesa'));
    }
  };

  const editar = async () => {
    if (!despesaExistente) return;
    setErro(null);
    if (!estabelecimento.trim()) {
      setErro(t(isReceita ? 'Informe a origem' : 'Informe o estabelecimento'));
      return;
    }
    if (!valorCentavos || valorCentavos <= 0) {
      setErro(t('Informe um valor válido'));
      return;
    }

    try {
      setEnviando(true);
      await editarDespesa({
        ...despesaExistente,
        estabelecimento: estabelecimento.trim(),
        valorCentavos,
        categoria,
        formaPagamento,
        data,
        cartaoId,
        observacao: observacao.trim() || undefined,
        atualizadoEm: new Date().toISOString(),
      });
      setEnviando(false);
      navigate('/');
    } catch (e) {
      setEnviando(false);
      console.error(`Erro ao editar ${isReceita ? 'receita' : 'despesa'}:`, e);
      setErro(t(isReceita ? 'Erro ao salvar receita' : 'Erro ao editar despesa'));
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-6 text-foreground sm:px-6 lg:py-12">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center gap-2 mb-6">
          <button
            onClick={() => navigate('/')}
            className="p-2 rounded-lg bg-[var(--tema-input)] hover:bg-[var(--tema-surface-elevado)] text-[var(--tema-text-primary)]"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <h1 className="text-xl font-bold">
            {modoEdicao
              ? t(isReceita ? 'Editar receita' : 'Editar despesa')
              : t(isReceita ? 'Nova receita' : 'Nova despesa')}
          </h1>
        </div>

        {erro && (
          <div className="mb-4 rounded-lg bg-red-500/10 border border-red-500/30 p-3">
            <div className="flex items-center gap-2 text-sm text-red-400">
              <span className="text-xs">{erro}</span>
            </div>
          </div>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault();
            modoEdicao ? editar() : salvar();
          }}
          className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-x-6 md:gap-y-5 md:rounded-3xl md:border md:border-[var(--tema-border)] md:bg-[var(--tema-surface)] md:p-8"
        >
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
              {t(isReceita ? 'Origem' : 'Estabelecimento')}
            </label>
            <input
              type="text"
              value={estabelecimento}
              onChange={(e) => setEstabelecimento(e.target.value)}
              placeholder={t(isReceita ? 'Ex.: Salário ou freelance' : 'Ex.: Supermercado (1/3)')}
              className="w-full px-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
            />
            {podeParcelar && (
              <p className="text-xs text-[var(--tema-accent)] mt-1">
                {t('Detalhe de parcelas (x/y) será dividido automaticamente')}
              </p>
            )}
          </div>


          <div>
            <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
              {t('Valor (R$)')}
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--tema-text-secondary)] text-sm">
                {idioma === 'pt-BR' ? 'R$' : '$'}
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={valorReais}
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, '');
                  setValorCentavos(parseInt(digits || '0', 10));
                }}
                placeholder={idioma === 'pt-BR' ? '0,00' : '0.00'}
                className="w-full pl-8 pr-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
              {t('Categoria')}
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value as Category)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
            >
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {t(CATEGORY_LABELS[c])}
                </option>
              ))}
            </select>
          </div>

          {!isReceita && (
            <div>
              <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
                {t('Forma de pagamento')}
              </label>
              <select
                value={formaPagamento}
                onChange={(e) =>
                  setFormaPagamento(e.target.value as PaymentMethod)
                }
                className="w-full px-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
              >
                {[PaymentMethod.dinheiro, PaymentMethod.debito, PaymentMethod.credito, PaymentMethod.pix, PaymentMethod.outros].map(
                  (m) => (
                    <option key={m} value={m}>
                      {t(PAYMENT_METHOD_LABELS[m])}
                    </option>
                  )
                )}
              </select>
            </div>
          )}

          {!isReceita && formaPagamento === PaymentMethod.credito && (
            <div>
              <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
                {t('Cartão de crédito')}
              </label>
              <select
                value={cartaoId ?? ''}
                onChange={(e) =>
                  setCartaoId(e.target.value ? Number(e.target.value) : undefined)
                }
                className="w-full px-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
              >
                <option value="">{t('Nenhum (à vista)')}</option>
                {cartoes
                  .slice()
                  .sort((a, b) => a.nome.localeCompare(b.nome))
                  .map((cartao) => (
                    <option key={cartao.id ?? cartao.nome} value={cartao.id}>
                      {cartao.banco} · {cartao.nome} · {t(cartao.bandeira)}
                    </option>
                  ))}
              </select>
              {cartoesLoading ? (
                <p className="mt-1 text-xs text-[var(--tema-text-secondary)]">{t('Carregando cartões…')}</p>
              ) : cartoes.length === 0 ? (
                <button
                  type="button"
                  onClick={() => navigate('/cartao/nova')}
                  className="mt-1 text-left text-xs text-[var(--tema-accent)] hover:underline"
                >
                  {t('Cadastre cartões na tela de Cartões para vinculá-los aqui.')}
                </button>
              ) : null}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
              {t('Data')}
            </label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
              {t('Observação')}
            </label>
            <textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              rows={2}
              placeholder={t('Notas adicionais…')}
              className="w-full px-3 py-2 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] text-[var(--tema-text-primary)] focus:outline-none focus:border-[var(--tema-accent)] text-sm"
            />
          </div>

          {!isReceita && (
            <div className="space-y-2 md:col-span-2">
              <label className="block text-sm font-medium text-[var(--tema-text-primary)] mb-1">
                {t('Foto do cupom')}
              </label>
              <input
                type="file"
                accept="image/*"
                disabled={lendoCupom}
                onChange={(event) => {
                  const input = event.currentTarget;
                  setArquivoCupom(null);
                  void selecionarCupom(input.files?.[0]);
                  input.value = '';
                }}
                className="block w-full text-sm text-[var(--tema-text-primary)] file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--tema-input)] file:px-3 file:py-2 file:text-[var(--tema-text-primary)] hover:file:bg-[var(--tema-surface-elevado)]"
              />
              <p className="text-xs text-[var(--tema-text-secondary)]">
                {t('A imagem é processada localmente no navegador. Na primeira leitura, os componentes de OCR e o modelo em português são baixados.')}
              </p>
              {lendoCupom && (
                <p className="text-xs text-[var(--tema-text-secondary)]">
                  {t('Reconhecendo texto…')} {Math.round(progressoOcr * 100)}%
                </p>
              )}
              {erroCupom && (
                <p role="alert" className="text-xs text-red-400">{erroCupom}</p>
              )}
              {arquivoCupom && (
                <div className="rounded-lg border border-[var(--tema-border)] bg-[var(--tema-surface-elevado)] p-3">
                  <img
                    src={arquivoCupom.previewDataUrl}
                    alt={t('Prévia do cupom')}
                    className="max-h-64 max-w-full rounded object-contain"
                  />
                  <p className="mt-2 text-xs text-[var(--tema-text-secondary)]">
                    {arquivoCupom.fileName} · {t('Confira os dados reconhecidos antes de salvar.')}
                  </p>
                  <details className="mt-2 text-xs text-[var(--tema-text-secondary)]">
                    <summary className="cursor-pointer">{t('Texto reconhecido')}</summary>
                    <pre className="mt-2 whitespace-pre-wrap font-sans">
                      {arquivoCupom.text || t('Nenhum texto foi reconhecido.')}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-2 md:col-span-2 md:justify-end">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="flex-1 py-2.5 rounded-lg bg-[var(--tema-input)] border border-[var(--tema-border)] hover:bg-[var(--tema-surface-elevado)] text-sm font-medium text-[var(--tema-text-primary)]"
            >
              {t('Cancelar')}
            </button>
            <button
              type="submit"
              disabled={enviando || lendoCupom}
              className="flex-1 py-2.5 rounded-lg bg-[var(--tema-accent)] hover:bg-[var(--tema-accent)]/90 disabled:opacity-50 text-sm font-medium"
            >
              {enviando
                ? t('Salvando…')
                : modoEdicao
                  ? t('Salvar alterações')
                  : t(isReceita ? 'Adicionar receita' : 'Adicionar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default DespesaForm;
