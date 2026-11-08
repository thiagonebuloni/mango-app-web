import Tesseract from 'tesseract.js';

const MAX_RECEIPT_IMAGE_BYTES = 8 * 1024 * 1024;
const MONEY_PATTERN = /(?:R\$\s*)?(\d{1,3}(?:\.\d{3})*,\d{2}|\d+,\d{2})/g;
const DATE_PATTERN = /\b(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})\b/;

export type ReceiptOcrErrorCode =
  | 'unsupported-file'
  | 'file-too-large'
  | 'read-failed'
  | 'ocr-failed';

export class ReceiptOcrError extends Error {
  readonly code: ReceiptOcrErrorCode;

  constructor(code: ReceiptOcrErrorCode) {
    super(code);
    this.name = 'ReceiptOcrError';
    this.code = code;
  }
}

export interface ReceiptFileResult {
  fileName: string;
  sizeBytes: number;
  previewDataUrl: string;
  text: string;
  merchant?: string;
  totalCents?: number;
  date?: string;
  paymentMethod?: 'dinheiro' | 'debito' | 'credito' | 'pix' | 'outros';
}

let workerPromise: Promise<Tesseract.Worker> | null = null;

function getWorker(
  onProgress: (progress: number) => void,
): Promise<Tesseract.Worker> {
  if (!workerPromise) {
    workerPromise = Tesseract.createWorker('por', Tesseract.OEM.LSTM_ONLY, {
      logger: ({ status, progress }) => {
        if (status === 'recognizing text') onProgress(progress);
      },
    });
  }
  return workerPromise;
}

function parseMoney(text: string): number | undefined {
  const amounts = [...text.matchAll(MONEY_PATTERN)].map((match) =>
    Number.parseInt(match[1].replace(/\./g, '').replace(',', ''), 10),
  );
  if (amounts.length === 0) return undefined;

  const totalLine = text
    .split(/\r?\n/)
    .reverse()
    .find((line) => /\btotal\b|valor\s*(?:a\s*pagar|pago)/i.test(line));
  if (totalLine) {
    const total = [...totalLine.matchAll(MONEY_PATTERN)].at(-1)?.[1];
    if (total) return Number.parseInt(total.replace(/\./g, '').replace(',', ''), 10);
  }
  return Math.max(...amounts);
}

function parseDate(text: string): string | undefined {
  for (const line of text.split(/\r?\n/)) {
    if (/valid|venc|fabric|promoc/i.test(line)) continue;
    const match = DATE_PATTERN.exec(line);
    if (!match) continue;

    const day = Number(match[1]);
    const month = Number(match[2]);
    const rawYear = Number(match[3]);
    const year = rawYear < 100 ? 2000 + rawYear : rawYear;
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      year >= 2000 &&
      year <= 2100 &&
      date.getUTCFullYear() === year &&
      date.getUTCMonth() === month - 1 &&
      date.getUTCDate() === day
    ) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }
  return undefined;
}

function parseMerchant(text: string): string | undefined {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const cnpjLine = lines.findIndex((line) => /CNPJ/i.test(line));
  const candidates = cnpjLine >= 0
    ? lines.slice(Math.max(0, cnpjLine - 2), cnpjLine).reverse()
    : lines.slice(0, 3);

  return candidates.find((line) =>
    line.length >= 3 &&
    line.length <= 60 &&
    !/(?:R\$\s*)?\d{1,3}(?:\.\d{3})*,\d{2}/.test(line) &&
    !/cpf|cnpj|inscri|endereco|rua|avenida/i.test(line),
  );
}

function parsePaymentMethod(text: string): ReceiptFileResult['paymentMethod'] {
  const normalized = text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/\bpix\b/.test(normalized)) return 'pix';
  if (/credito|credit card/.test(normalized)) return 'credito';
  if (/debito|debit card/.test(normalized)) return 'debito';
  if (/dinheiro|cash|a vista/.test(normalized)) return 'dinheiro';
  return undefined;
}

export function parseReceiptText(
  text: string,
): Pick<ReceiptFileResult, 'merchant' | 'totalCents' | 'date' | 'paymentMethod'> {
  return {
    merchant: parseMerchant(text),
    totalCents: parseMoney(text),
    date: parseDate(text),
    paymentMethod: parsePaymentMethod(text),
  };
}

class ReceiptOcrService {
  async extractText(
    file: File,
    onProgress: (progress: number) => void = () => {},
  ): Promise<ReceiptFileResult> {
    if (!file.type.startsWith('image/')) {
      throw new ReceiptOcrError('unsupported-file');
    }
    if (file.size > MAX_RECEIPT_IMAGE_BYTES) {
      throw new ReceiptOcrError('file-too-large');
    }

    const previewDataUrl = await this.readAsDataUrl(file);
    let worker: Tesseract.Worker | undefined;
    try {
      worker = await getWorker(onProgress);
      const {
        data: { text },
      } = await worker.recognize(file);
      return {
        fileName: file.name,
        sizeBytes: file.size,
        previewDataUrl,
        text: text.trim(),
        ...parseReceiptText(text),
      };
    } catch (error) {
      if (error instanceof ReceiptOcrError) throw error;
      workerPromise = null;
      if (worker) {
        void worker.terminate().catch((terminationError: unknown) => {
          console.error('Erro ao encerrar o worker de OCR:', terminationError);
        });
      }
      console.error('Erro no reconhecimento OCR do cupom:', error);
      throw new ReceiptOcrError('ocr-failed');
    }
  }

  private readAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new ReceiptOcrError('read-failed'));
      reader.onabort = () => reject(new ReceiptOcrError('read-failed'));
      reader.onload = () => {
        if (typeof reader.result !== 'string') {
          reject(new ReceiptOcrError('read-failed'));
          return;
        }
        resolve(reader.result);
      };
      reader.readAsDataURL(file);
    });
  }
}

export const receiptOcrService = new ReceiptOcrService();
