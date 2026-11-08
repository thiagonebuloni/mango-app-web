import {
  BandeiraCartao,
  Category,
  PaymentMethod,
  type TemaCor,
  type CartaoCredito,
  type Expense,
  type SegurancaConfig,
  type TentativasBloqueio,
  type UserProfile,
} from '../types/models';
import {
  deleteLocalDatabase,
  initDB,
  loadDataSnapshot,
  replaceDataSnapshot,
  type MangoDataSnapshot,
} from './db';
import { supabase, type Json } from './supabase';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value);
}

function isOneOf<T extends string>(value: unknown, values: readonly T[]): value is T {
  return typeof value === 'string' && values.includes(value as T);
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

function parseExpense(value: Json): Expense {
  if (!isRecord(value)
    || typeof value.estabelecimento !== 'string'
    || !isInteger(value.valorCentavos)
    || !isOneOf(value.categoria, Object.values(Category))
    || !isOneOf(value.formaPagamento, Object.values(PaymentMethod))
    || typeof value.data !== 'string'
    || (value.id !== undefined && !isInteger(value.id))
    || (value.cartaoId !== undefined && !isInteger(value.cartaoId))
    || (value.parcelado !== undefined && typeof value.parcelado !== 'boolean')
    || (value.parcelaAtual !== undefined && !isInteger(value.parcelaAtual))
    || (value.totalParcelas !== undefined && !isInteger(value.totalParcelas))
    || (value.fotoPath !== undefined && typeof value.fotoPath !== 'string')
    || (value.observacao !== undefined && typeof value.observacao !== 'string')) {
    throw new Error('Uma despesa salva no Supabase está em formato inválido.');
  }
  return {
    id: value.id,
    estabelecimento: value.estabelecimento,
    valorCentavos: value.valorCentavos,
    categoria: value.categoria,
    formaPagamento: value.formaPagamento,
    data: value.data,
    cartaoId: value.cartaoId,
    parcelado: value.parcelado,
    parcelaAtual: value.parcelaAtual,
    totalParcelas: value.totalParcelas,
    fotoPath: value.fotoPath,
    observacao: value.observacao,
    grupoParcela: optionalString(value.grupoParcela),
    criadoEm: optionalString(value.criadoEm),
    atualizadoEm: optionalString(value.atualizadoEm),
  };
}

function parseCard(value: Json): CartaoCredito {
  if (!isRecord(value)
    || typeof value.banco !== 'string'
    || !isOneOf(value.bandeira, Object.values(BandeiraCartao))
    || typeof value.nome !== 'string'
    || !isInteger(value.diaFechamento)
    || !isInteger(value.diaPagamento)
    || (value.id !== undefined && !isInteger(value.id))
    || (value.limiteCentavos !== undefined && !isInteger(value.limiteCentavos))) {
    throw new Error('Um cartão salvo no Supabase está em formato inválido.');
  }
  return {
    id: value.id,
    banco: value.banco,
    bandeira: value.bandeira,
    nome: value.nome,
    diaFechamento: value.diaFechamento,
    diaPagamento: value.diaPagamento,
    limiteCentavos: value.limiteCentavos,
  };
}

function parseProfile(value: Json | undefined): UserProfile | null {
  if (value === null) return null;
  if (!isRecord(value)
    || typeof value.temaClaro !== 'boolean'
    || !isInteger(value.corFundo)
    || !isOneOf(value.temaCor, ['soft-pastel', 'ocean-blue', 'forest-green', 'sunset-warm', 'lavender-mist'] satisfies TemaCor[])
    || !isOneOf(value.idioma, ['pt-BR', 'en-US'])
    || typeof value.username !== 'string'
    || typeof value.avatar !== 'string') {
    throw new Error('O perfil salvo no Supabase está em formato inválido.');
  }
  return {
    temaClaro: value.temaClaro,
    corFundo: value.corFundo,
    temaCor: value.temaCor,
    idioma: value.idioma,
    username: value.username,
    avatar: value.avatar,
  };
}

function parseSecurity(value: Json | undefined): SegurancaConfig | null {
  if (value === null) return null;
  if (!isRecord(value)
    || typeof value.pinAtivo !== 'boolean'
    || typeof value.bloqueioAtivo !== 'boolean'
    || (value.pinHash !== undefined && typeof value.pinHash !== 'string')) {
    throw new Error('As configurações de segurança no Supabase estão em formato inválido.');
  }
  return {
    pinAtivo: value.pinAtivo,
    bloqueioAtivo: value.bloqueioAtivo,
    pinHash: optionalString(value.pinHash),
  };
}

function parseAttempts(value: Json | undefined): TentativasBloqueio {
  if (!isRecord(value)
    || !isInteger(value.contador)
    || (value.bloqueioAte !== undefined && typeof value.bloqueioAte !== 'string')) {
    throw new Error('As tentativas de PIN no Supabase estão em formato inválido.');
  }
  return {
    contador: value.contador,
    bloqueioAte: optionalString(value.bloqueioAte),
  };
}

function parseMerchant(value: Json): MangoDataSnapshot['merchants'][number] {
  if (!isRecord(value)
    || typeof value.estabelecimento !== 'string'
    || !isOneOf(value.categoria, Object.values(Category))) {
    throw new Error('Uma categoria de estabelecimento no Supabase está em formato inválido.');
  }
  return { estabelecimento: value.estabelecimento, categoria: value.categoria };
}

function toJson(value: unknown): Json {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (Array.isArray(value)) return value.map(toJson);
  if (isRecord(value)) {
    const result: { [key: string]: Json | undefined } = {};
    for (const [key, nested] of Object.entries(value)) {
      if (nested !== undefined) result[key] = toJson(nested);
    }
    return result;
  }
  throw new Error('Não foi possível converter os dados locais para JSON.');
}

function parseSnapshot(value: Json): MangoDataSnapshot {
  if (!isRecord(value)
    || !Array.isArray(value.expenses)
    || !Array.isArray(value.cartoes)
    || !Array.isArray(value.merchants)) {
    throw new Error('Os dados salvos no Supabase estão em um formato inválido.');
  }

  return {
    expenses: value.expenses.map(parseExpense),
    cartoes: value.cartoes.map(parseCard),
    perfil: parseProfile(value.perfil),
    seguranca: parseSecurity(value.seguranca),
    tentativas: parseAttempts(value.tentativas),
    merchants: value.merchants.map(parseMerchant),
  };
}

async function saveCloudSnapshot(userId: string, snapshot: MangoDataSnapshot): Promise<void> {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase.from('user_data').upsert({
    user_id: userId,
    data: toJson(snapshot),
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;
  localStorage.setItem('mango_sync_pending', 'false');
}

export async function connectAccountData(userId: string): Promise<void> {
  if (!supabase) return;

  const accountMarker = localStorage.getItem('mango_local_account_id');
  const pendingLocalChanges = localStorage.getItem('mango_sync_pending') === 'true';
  let localSnapshot = await loadDataSnapshot();

  if (accountMarker && accountMarker !== userId) {
    await deleteLocalDatabase();
    await initDB();
    localSnapshot = await loadDataSnapshot();
  }

  const { data: remote, error } = await supabase
    .from('user_data')
    .select('data')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;

  if (remote) {
    if (accountMarker === userId && pendingLocalChanges) {
      await saveCloudSnapshot(userId, localSnapshot);
    } else {
      await replaceDataSnapshot(parseSnapshot(remote.data));
    }
  } else {
    await saveCloudSnapshot(userId, localSnapshot);
  }

  localStorage.setItem('mango_local_account_id', userId);
}

export async function syncAccountData(userId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase não está configurado.');
  localStorage.setItem('mango_sync_pending', 'true');
  await saveCloudSnapshot(userId, await loadDataSnapshot());
}

export async function requestAccountDeletion(): Promise<void> {
  if (!supabase) throw new Error('Supabase não está configurado.');
  const { error } = await supabase.functions.invoke('request-account-deletion');
  if (error) throw error;
}
