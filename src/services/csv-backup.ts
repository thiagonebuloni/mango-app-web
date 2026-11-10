import {
  BandeiraCartao,
  PaymentMethod,
  categoryFromName,
  categoryIsReceita,
  type CartaoCreditoInput,
  type Expense,
  type ExpenseInput,
  type UserProfile,
} from '../types/models';

const HEADER_V3 = ['tipo', 'valor', 'data_hora', 'categoria', 'forma', 'descricao', 'estabelecimento', 'origem', 'cartao'];
const HEADER_V2 = HEADER_V3.slice(0, 8);
const MAX_FILE_BYTES = 16 * 1024 * 1024;
const MAX_RECORDS = 200_000;

export interface CsvExpenseInput extends ExpenseInput {
  cartaoNome?: string;
}

export interface MangoCsvImport {
  expenses: CsvExpenseInput[];
  cards: CartaoCreditoInput[];
  profile: UserProfile | null;
  skipped: number;
}

function quoteCsv(value: string): string {
  return `"${value.replaceAll('"', '""')}"`;
}

function csvRow(values: Array<string | number>): string {
  return values.map((value) => typeof value === 'number' ? String(value) : quoteCsv(value)).join(';');
}

function dateTimeForCsv(date: string): string {
  return `${date}T12:00:00.000`;
}

export function exportMangoCsv(
  expenses: Expense[],
  cards: Array<CartaoCreditoInput & { id?: number }>,
  profile: UserProfile | null,
): string {
  const cardNames = new Map(cards.flatMap((card) => card.id === undefined ? [] : [[card.id, card.nome] as const]));
  const lines = [
    '# MANGO_BACKUP v3',
    '# AVISO;Backup em texto puro, sem senha. Guarde em local seguro.',
  ];

  if (profile) {
    const colorArgb = profile.corFundo <= 0xffffff ? 0xff000000 + profile.corFundo : profile.corFundo;
    const avatar = /^[\p{Emoji}\s]+$/u.test(profile.avatar) ? profile.avatar : '';
    lines.push(`# PERFIL;nome=${quoteCsv(profile.username)};avatar=${quoteCsv(avatar)};cor=${colorArgb};tema=${profile.temaClaro ? 'claro' : 'escuro'}`);
  }

  const orderedCards = [...cards].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  for (const card of orderedCards) {
    lines.push(`# CARTAO;banco=${quoteCsv(card.banco)};bandeira=${card.bandeira};nome=${quoteCsv(card.nome)};fechamento=${card.diaFechamento};pagamento=${card.diaPagamento}${card.limiteCentavos ? `;limite=${card.limiteCentavos}` : ''}`);
  }

  lines.push(HEADER_V3.join(';'));
  const orderedExpenses = [...expenses].sort((a, b) => a.data.localeCompare(b.data) || (a.id ?? 0) - (b.id ?? 0));
  for (const expense of orderedExpenses) {
    lines.push(csvRow([
      categoryIsReceita(expense.categoria) ? 'receita' : 'despesa',
      expense.valorCentavos,
      dateTimeForCsv(expense.data),
      expense.categoria,
      expense.formaPagamento,
      expense.observacao ?? '',
      expense.estabelecimento,
      'manual',
      expense.cartaoId === undefined ? '' : cardNames.get(expense.cartaoId) ?? '',
    ]));
  }

  return `${lines.join('\n')}\n`;
}

function parseRecords(text: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = '';
  let quoted = false;

  const finishField = () => {
    record.push(field);
    field = '';
  };
  const finishRecord = () => {
    finishField();
    if (record.some((value) => value.length > 0)) records.push(record);
    record = [];
  };

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) {
      if (character === '"' && text[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ';') {
      finishField();
    } else if (character === '\n' || character === '\r') {
      finishRecord();
      if (character === '\r' && text[index + 1] === '\n') index += 1;
    } else {
      field += character;
    }

    if (records.length > MAX_RECORDS) {
      throw new Error('Arquivo com linhas demais para importar. Divida o CSV em partes menores.');
    }
  }

  if (quoted) throw new Error('O CSV contém aspas sem fechamento.');
  if (field.length > 0 || record.length > 0) finishRecord();
  return records;
}

function parseKeyValueFields(fields: string[]): Record<string, string> {
  const values: Record<string, string> = {};
  for (const field of fields) {
    const separator = field.indexOf('=');
    if (separator <= 0) continue;
    values[field.slice(0, separator).trim().toLowerCase()] = field.slice(separator + 1).trim();
  }
  return values;
}

function parseCard(record: string[]): CartaoCreditoInput | null {
  const fields = parseKeyValueFields(record.slice(1));
  const banco = fields.banco?.trim() ?? '';
  const nome = fields.nome?.trim() ?? '';
  const bandeira = fields.bandeira as CartaoCreditoInput['bandeira'];
  const diaFechamento = Number(fields.fechamento);
  const diaPagamento = Number(fields.pagamento);
  const limiteCentavos = fields.limite === undefined ? undefined : Number(fields.limite);

  if (
    !banco || banco.length > 40 || !nome || nome.length > 40
    || !Object.values(BandeiraCartao).includes(bandeira)
    || !Number.isInteger(diaFechamento) || diaFechamento < 1 || diaFechamento > 31
    || !Number.isInteger(diaPagamento) || diaPagamento < 1 || diaPagamento > 31
    || (limiteCentavos !== undefined && (!Number.isSafeInteger(limiteCentavos) || limiteCentavos <= 0))
  ) return null;

  return { banco, nome, bandeira, diaFechamento, diaPagamento, limiteCentavos };
}

function parseProfile(record: string[]): UserProfile | null {
  const fields: Record<string, string> = {};
  for (const field of record.slice(1)) {
    const separator = field.indexOf('=');
    if (separator <= 0) continue;
    fields[field.slice(0, separator).trim().toLowerCase()] = field.slice(separator + 1).trim();
  }

  const username = fields.nome ?? '';
  const avatar = fields.avatar ?? '';
  const colorArgb = Number(fields.cor);
  if (
    username.length > 40
    || avatar.length > 64
    || !Number.isSafeInteger(colorArgb)
    || colorArgb < 0
    || colorArgb > 0xffffffff
  ) return null;

  return {
    username,
    avatar,
    corFundo: colorArgb & 0xffffff,
    temaClaro: fields.tema?.toLowerCase() === 'claro',
    temaCor: 'soft-pastel',
    idioma: 'pt-BR',
  };
}

function parseExpense(record: string[], hasCardColumn: boolean): CsvExpenseInput | null {
  const [type, centsValue, dateTime, categoryName, paymentName, notes, merchant] = record;
  const typeValue = type?.trim().toLowerCase();
  const valorCentavos = Number(centsValue?.trim());
  const date = dateTime?.trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1];
  const [year, month, day] = date?.split('-').map(Number) ?? [];
  const parsedDate = date ? new Date(Date.UTC(year, month - 1, day)) : null;
  if (
    (typeValue !== 'despesa' && typeValue !== 'receita')
    || !Number.isSafeInteger(valorCentavos) || valorCentavos <= 0
    || !date || !parsedDate || parsedDate.toISOString().slice(0, 10) !== date
  ) return null;

  const category = categoryFromName(categoryName?.trim(), typeValue);
  const payment = Object.values(PaymentMethod).find((value) => value === paymentName?.trim()) ?? PaymentMethod.outros;
  const cartaoNome = hasCardColumn ? record[8]?.trim() : '';

  return {
    estabelecimento: merchant?.trim() || (typeValue === 'receita' ? 'Receita' : 'Despesa'),
    valorCentavos,
    categoria: category,
    formaPagamento: payment,
    data: date,
    observacao: notes?.trim() || undefined,
    cartaoNome: cartaoNome || undefined,
  };
}

export function parseMangoCsv(text: string): MangoCsvImport {
  if (new TextEncoder().encode(text).byteLength > MAX_FILE_BYTES) {
    throw new Error('Arquivo muito grande para importar. O limite é 16 MB.');
  }

  const records = parseRecords(text.replace(/^\uFEFF/, ''));
  let header: string[] | null = null;
  let hasCardColumn = false;
  const expenses: CsvExpenseInput[] = [];
  const cards: CartaoCreditoInput[] = [];
  let skipped = 0;
  let profile: UserProfile | null = null;

  for (const record of records) {
    if (record[0].startsWith('#')) {
      if (record[0] === '# PERFIL') {
        profile = parseProfile(record);
        if (!profile) skipped += 1;
      } else if (record[0] === '# CARTAO') {
        const card = parseCard(record);
        if (card) cards.push(card);
        else skipped += 1;
      }
      continue;
    }

    if (record.length === HEADER_V3.length && record.every((value, index) => value.trim() === HEADER_V3[index])) {
      header = HEADER_V3;
      hasCardColumn = true;
      continue;
    }
    if (record.length === HEADER_V2.length && record.every((value, index) => value.trim() === HEADER_V2[index])) {
      header = HEADER_V2;
      hasCardColumn = false;
      continue;
    }
    if (!header) {
      throw new Error('Cabeçalho CSV Mango v2/v3 não encontrado.');
    }

    const expense = parseExpense(record, hasCardColumn);
    if (expense) expenses.push(expense);
    else skipped += 1;
  }

  if (!header) throw new Error('Cabeçalho CSV Mango v2/v3 não encontrado.');
  return { expenses, cards, profile, skipped };
}
