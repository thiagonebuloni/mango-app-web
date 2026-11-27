import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Check, Minus, Plus, X } from 'lucide-react';
import { useI18n } from '../utils/i18n';

interface AvatarResizeModalProps {
  /** Se o diálogo está visível */
  isOpen: boolean;
  /** Imagem original em base64 (sem prefixo data:) ou data URL completa */
  imageSrc: string;
  /** Chamado ao confirmar com a imagem redimensionada (base64 sem prefixo) */
  onConfirm: (base64: string) => void;
  /** Chamado ao cancelar/fechar */
  onCancel: () => void;
}

/** Resolução interna fixa usada tanto para preview quanto para saída. */
const OUTPUT_SIZE = 512;

/** Diálogo de recorte/redimensionamento de avatar (crop circular). */
export function AvatarResizeModal({
  isOpen,
  imageSrc,
  onConfirm,
  onCancel,
}: AvatarResizeModalProps) {
  const { t } = useI18n();

  const [scale, setScale] = useState(1);
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [startDrag, setStartDrag] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // Monta data URL completa a partir do base64 (com ou sem prefixo)
  const dataUrl = useMemo(() => {
    if (!imageSrc) return '';
    return imageSrc.startsWith('data:') ? imageSrc : `data:image/jpeg;base64,${imageSrc}`;
  }, [imageSrc]);

  // Carrega a imagem e calcula escala inicial de ajuste (fit)
  useEffect(() => {
    if (!dataUrl) return;
    const img = new Image();
    img.src = dataUrl;
    imgRef.current = img;

    img.onload = () => {
      // Escala inicial: ajusta a imagem para caber dentro do OUTPUT_SIZE
      const fitScale = Math.min(OUTPUT_SIZE / img.width, OUTPUT_SIZE / img.height);
      setScale(fitScale);
      setOffsetX(0);
      setOffsetY(0);
    };
  }, [dataUrl]);

  const clampScale = useCallback(
    (s: number) => Math.min(Math.max(s, 0.1), 5),
    []
  );

  const incrementScale = useCallback(() => {
    setScale((s) => clampScale(s + 0.25));
  }, [clampScale]);

  const decrementScale = useCallback(() => {
    setScale((s) => clampScale(s - 0.25));
  }, [clampScale]);

  const resetView = useCallback(() => {
    if (!imgRef.current) return;
    const fitScale = Math.min(OUTPUT_SIZE / imgRef.current.width, OUTPUT_SIZE / imgRef.current.height);
    setScale(fitScale);
    setOffsetX(0);
    setOffsetY(0);
  }, []);

  // Arrastar para mover a imagem
  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return;
      setIsDragging(true);
      setStartDrag({ x: e.clientX - offsetX, y: e.clientY - offsetY });
    },
    [offsetX, offsetY]
  );

  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging) return;
      setOffsetX(e.clientX - startDrag.x);
      setOffsetY(e.clientY - startDrag.y);
    },
    [isDragging, startDrag]
  );

  const onMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Desenha o preview no canvas com máscara circular.
  // O canvas tem resolução interna fixa OUTPUT_SIZE x OUTPUT_SIZE e é exibido a 256px via CSS.
  useEffect(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    ctx.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);

    // Desenha a imagem com escala e offset, centralizada no círculo de recorte
    const drawWidth = img.width * scale;
    const drawHeight = img.height * scale;
    const drawX = OUTPUT_SIZE / 2 + offsetX - drawWidth / 2;
    const drawY = OUTPUT_SIZE / 2 + offsetY - drawHeight / 2;

    ctx.save();
    // Máscara circular (apenas a área dentro do círculo fica visível)
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);

    // Borda do círculo de recorte
    ctx.restore();
    ctx.beginPath();
    ctx.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.stroke();
  }, [dataUrl, scale, offsetX, offsetY]);

  // Área de arraste global (para soltar o mouse fora do canvas)
  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [onMouseMove, onMouseUp]);

  const handleConfirm = useCallback(() => {
    if (!imgRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // O preview canvas já contém a imagem recortada na resolução correta.
    // Apenas exporta seu conteúdo para base64.
    const dataUrlOut = canvas.toDataURL('image/jpeg', 0.85);
    const base64 = dataUrlOut.split(',')[1] ?? '';
    onConfirm(base64);
  }, [onConfirm]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/75 p-4 md:p-6 backdrop-blur-sm"
      onClick={onCancel}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-label={t('Recortar avatar')}
        className="w-full max-w-[640px] rounded-2xl border border-[var(--tema-border)] bg-[var(--tema-surface)] p-6 shadow-2xl text-[var(--tema-text-primary)] sm:p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">{t('Recortar avatar')}</h2>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg p-1.5 text-[var(--tema-text-secondary)] hover:bg-[var(--tema-surface-elevado)] transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Preview do recorte */}
        <div
          ref={containerRef}
          className="relative mx-auto w-64 h-64 rounded-full border-4 border-white/20 overflow-hidden bg-[var(--tema-input)] shadow-xl"
          onMouseDown={onMouseDown}
          style={{ touchAction: 'none' }}
        >
          <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full"
            style={{ imageRendering: 'pixelated' }}
          />
        </div>

        <p className="mt-2 text-xs text-center text-[var(--tema-text-secondary)]">
          {t('Arraste para mover a imagem')}
        </p>

        {/* Controles de escala */}
        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--tema-text-secondary)]">{t('Zoom')}</span>
            <span className="font-mono text-[var(--tema-text-primary)]">{Math.round(scale * 100)}%</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={decrementScale}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--tema-text-primary)] hover:bg-[var(--tema-surface-elevado)] transition"
              disabled={scale <= 0.1}
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--tema-accent)] hover:bg-[var(--tema-accent)]/10 transition"
            >
              {t('Redefinir')}
            </button>
            <button
              type="button"
              onClick={incrementScale}
              className="rounded-lg px-3 py-1.5 text-sm text-[var(--tema-text-primary)] hover:bg-[var(--tema-surface-elevado)] transition"
              disabled={scale >= 5}
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-[var(--tema-border)] px-4 py-2.5 text-sm font-medium text-[var(--tema-text-primary)] transition hover:bg-[var(--tema-surface-elevado)]"
          >
            {t('Cancelar')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="rounded-xl bg-[var(--tema-accent)] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-110"
          >
            <Check className="h-4 w-4 mr-1.5" /> {t('Confirmar')}
          </button>
        </div>
      </section>
    </div>
  );
}

AvatarResizeModal.displayName = 'AvatarResizeModal';
