import { useI18n } from '../utils/i18n';

interface ConfirmDialogProps {
  /** Se o diálogo está visível */
  isOpen: boolean;
  /** Título do diálogo (padrão: 'Descartar alterações não salvas?') */
  title?: string;
  /** Mensagem exibida no corpo do diálogo */
  message?: string;
  /** Rótulo do botão de confirmação (padrão: 'OK') */
  confirmLabel?: string;
  /** Rótulo do botão de cancelar (padrão: 'Cancelar') */
  cancelLabel?: string;
  /** Chamado ao confirmar a ação */
  onConfirm: () => void;
  /** Chamado ao cancelar/fechar o diálogo */
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useI18n();

  if (!isOpen) return null;

  const titulo = title ?? t('Descartar alterações não salvas?');
  const mensagem =
    message ??
    t(
      'As informações preenchidas no formulário serão perdidas. Deseja realmente cancelar?'
    );
  const botaoConfirmar = confirmLabel ?? t('OK');
  const botaoCancelar = cancelLabel ?? t('Cancelar');

  return (
    <div
      className="fixed inset-0 z-[80] grid place-items-center bg-black/60 p-4 md:p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirmar-descarte-titulo"
        className="w-full max-w-md rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-6 shadow-2xl text-[var(--tema-text-primary)] sm:p-8"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 id="confirmar-descarte-titulo" className="text-lg font-bold mb-2">
          {titulo}
        </h2>
        <p className="mb-6 text-sm leading-relaxed text-[var(--tema-text-secondary)]">
          {mensagem}
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--tema-border)] px-4 py-2.5 text-sm font-medium text-[var(--tema-text-primary)] transition hover:bg-[var(--tema-surface-elevado)]"
          >
            {botaoCancelar}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="rounded-xl bg-[var(--tema-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            {botaoConfirmar}
          </button>
        </div>
      </section>
    </div>
  );
}
