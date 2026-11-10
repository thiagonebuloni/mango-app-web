// Camada de persistência IndexedDB (substitui o sqflite/SQLite do Flutter).
// Usa a biblioteca `idb` (promissória sobre IndexedDB).
import { deleteDB, type DBSchema, type IDBPDatabase } from 'idb';
import { cartaoChaveEstavel } from '../types/models';
import type {
  Expense,
  ExpenseInput,
  CartaoCredito,
  CartaoCreditoInput,
  UserProfile,
  SegurancaConfig,
  TentativasBloqueio,
  Category,
} from '../types/models';
import type { CsvExpenseInput } from './csv-backup';
import { formatMoney } from '../utils/format';

const DB_NAME = 'mango_app_web';
const DB_VERSION = 1;

export interface MangoDataSnapshot {
  expenses: Expense[];
  cartoes: CartaoCredito[];
  perfil: UserProfile | null;
  seguranca: SegurancaConfig | null;
  tentativas: TentativasBloqueio;
  merchants: Array<{ estabelecimento: string; categoria: Category }>;
}

interface MangoDB extends DBSchema {
  expenses: {
    key: number;
    value: Expense;
    indexes: { 'por-data': string; 'por-categoria': string; 'por-cartao': number };
  };
  cartoes: {
    key: number;
    value: CartaoCredito;
  };
  perfil: {
    key: string;
    value: UserProfile;
  };
  seguranca: {
    key: string;
    value: SegurancaConfig;
  };
  tentativas: {
    key: string;
    value: TentativasBloqueio;
  };
  merchants: {
    key: string;
    value: { estabelecimento: string; categoria: Category };
  };
}

let dbInstance: IDBPDatabase<MangoDB> | null = null;

export async function getDB(): Promise<IDBPDatabase<MangoDB>> {
  if (dbInstance) return dbInstance;
  const { openDB: openDbFn } = await import('idb');
  dbInstance = await openDbFn<MangoDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      const expenseStore = db.createObjectStore('expenses', {
        keyPath: 'id',
        autoIncrement: true,
      });
      expenseStore.createIndex('por-data', 'data');
      expenseStore.createIndex('por-categoria', 'categoria');
      expenseStore.createIndex('por-cartao', 'cartaoId');

      db.createObjectStore('cartoes', { keyPath: 'id', autoIncrement: true });
      db.createObjectStore('perfil', { keyPath: 'id' });
      db.createObjectStore('seguranca', { keyPath: 'id' });
      db.createObjectStore('tentativas', { keyPath: 'id' });
      db.createObjectStore('merchants', { keyPath: 'estabelecimento' });
    },
  });
  return dbInstance;
}

export async function loadDataSnapshot(): Promise<MangoDataSnapshot> {
  const db = await getDB();
  const [expenses, cartoes, perfil, seguranca, tentativas, merchants] = await Promise.all([
    db.getAll('expenses'),
    db.getAll('cartoes'),
    db.get('perfil', 'perfil'),
    db.get('seguranca', 'seguranca'),
    db.get('tentativas', 'tentativas'),
    db.getAll('merchants'),
  ]);
  return {
    expenses,
    cartoes,
    perfil: perfil ?? null,
    seguranca: seguranca ?? null,
    tentativas: tentativas ?? { contador: 0 },
    merchants,
  };
}

export async function replaceDataSnapshot(snapshot: MangoDataSnapshot): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(
    ['expenses', 'cartoes', 'perfil', 'seguranca', 'tentativas', 'merchants'],
    'readwrite',
  );
  await Promise.all([
    tx.objectStore('expenses').clear(),
    tx.objectStore('cartoes').clear(),
    tx.objectStore('perfil').clear(),
    tx.objectStore('seguranca').clear(),
    tx.objectStore('tentativas').clear(),
    tx.objectStore('merchants').clear(),
  ]);
  for (const expense of snapshot.expenses) await tx.objectStore('expenses').put(expense);
  for (const cartao of snapshot.cartoes) await tx.objectStore('cartoes').put(cartao);
  if (snapshot.perfil) {
    await tx.objectStore('perfil').put({ ...snapshot.perfil, id: 'perfil' } as unknown as UserProfile);
  }
  if (snapshot.seguranca) {
    await tx.objectStore('seguranca').put({ ...snapshot.seguranca, id: 'seguranca' } as unknown as SegurancaConfig);
  }
  await tx.objectStore('tentativas').put({ ...snapshot.tentativas, id: 'tentativas' } as unknown as TentativasBloqueio);
  for (const merchant of snapshot.merchants) await tx.objectStore('merchants').put(merchant);
  await tx.done;
}

export async function deleteLocalDatabase(): Promise<void> {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
  await deleteDB(DB_NAME);
  localStorage.removeItem('mango_local_account_id');
  localStorage.removeItem('mango_sync_pending');
}
// ---------------- Despesas ----------------

export async function allExpenses(): Promise<Expense[]> {
  const db = await getDB();
  return db.getAll('expenses');
}

export async function expensesPorMes(mesISO: string): Promise<Expense[]> {
  const db = await getDB();
  const tx = db.transaction('expenses', 'readonly');
  const store = tx.store;
  const index = store.index('por-data');
  const todos = await index.getAll(IDBKeyRange.bound(mesISO, mesISO + '\uffff'));
  await tx.done;
  return todos;
}

export async function insertExpense(expense: ExpenseInput): Promise<number> {
  const db = await getDB();
  const agora = new Date().toISOString();
  const valor: Expense = {
    ...expense,
    criadoEm: agora,
    atualizadoEm: agora,
  };
  const id = await db.add('expenses', valor);
  return id;
}

export async function insertExpensesBatch(expenses: ExpenseInput[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('expenses', 'readwrite');
  const agora = new Date().toISOString();
  for (const e of expenses) {
    await tx.store.add({
      ...e,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }
  await tx.done;
}

export async function appendCsvBackupData(
  expenses: CsvExpenseInput[],
  cards: CartaoCreditoInput[],
  profile: UserProfile | null,
): Promise<void> {
  const db = await getDB();
  const tx = db.transaction(['expenses', 'cartoes', 'perfil'], 'readwrite');
  const cardStore = tx.objectStore('cartoes');
  const existingCards = await cardStore.getAll();
  const cardIdsByKey = new Map(
    existingCards.flatMap((card) => card.id === undefined
      ? []
      : [[cartaoChaveEstavel(card), card.id] as const]),
  );
  const cardIdsByName = new Map<string, number>(
    existingCards.flatMap((card) => card.id === undefined ? [] : [[card.nome, card.id] as const]),
  );

  for (const card of cards) {
    const key = cartaoChaveEstavel(card);
    let id = cardIdsByKey.get(key);
    if (id === undefined) {
      id = await cardStore.add(card);
      cardIdsByKey.set(key, id);
    }
    cardIdsByName.set(card.nome, id);
  }

  const expenseStore = tx.objectStore('expenses');
  const agora = new Date().toISOString();
  for (const { cartaoNome, ...expense } of expenses) {
    const cartaoId = cartaoNome ? cardIdsByName.get(cartaoNome) : undefined;
    await expenseStore.add({
      ...expense,
      cartaoId: cartaoId ?? expense.cartaoId,
      criadoEm: agora,
      atualizadoEm: agora,
    });
  }
  if (profile) {
    await tx.objectStore('perfil').put({ ...profile, id: 'perfil' } as unknown as UserProfile);
  }
  await tx.done;
}

export async function updateExpense(expense: Expense): Promise<void> {
  const db = await getDB();
  await db.put('expenses', {
    ...expense,
    atualizadoEm: new Date().toISOString(),
  } as unknown as Expense & { id: number });
}

export async function deleteExpense(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', id);
}

// ---------------- Cartões ----------------

export async function allCartoes(): Promise<CartaoCredito[]> {
  const db = await getDB();
  return db.getAll('cartoes');
}

export async function insertCartao(cartao: CartaoCreditoInput): Promise<number> {
  const db = await getDB();
  return db.add('cartoes', cartao);
}

export async function updateCartao(cartao: CartaoCredito): Promise<void> {
  const db = await getDB();
  await db.put('cartoes', cartao);
}

export async function deleteCartao(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('cartoes', id);
}

// ---------------- Perfil ----------------

export async function loadProfile(): Promise<UserProfile | null> {
  const db = await getDB();
  const salvo = await db.get('perfil', 'perfil');
  return salvo ?? null;
}

export async function saveProfile(perfil: UserProfile): Promise<void> {
  const db = await getDB();
  await db.put('perfil', { ...perfil, id: 'perfil' } as unknown as UserProfile);
}

// ---------------- Segurança ----------------

export async function loadSeguranca(): Promise<SegurancaConfig | null> {
  const db = await getDB();
  const salvo = await db.get('seguranca', 'seguranca');
  return salvo ?? null;
}

export async function saveSeguranca(config: SegurancaConfig): Promise<void> {
  const db = await getDB();
  await db.put('seguranca', { ...config, id: 'seguranca' } as unknown as SegurancaConfig);
}

// ---------------- Tentativas de PIN ----------------

export async function loadTentativas(): Promise<TentativasBloqueio> {
  const db = await getDB();
  const salvo = await db.get('tentativas', 'tentativas');
  return salvo ?? { contador: 0 };
}

export async function saveTentativas(t: TentativasBloqueio): Promise<void> {
  const db = await getDB();
  await db.put('tentativas', { ...t, id: 'tentativas' } as TentativasBloqueio);
}

// ---------------- Memorização de estabelecimento → categoria ----------------

export async function memorizeMerchant(
  estabelecimento: string,
  categoria: Category,
): Promise<void> {
  const db = await getDB();
  await db.put('merchants', { estabelecimento, categoria });
}

export async function merchantCategoria(
  estabelecimento: string,
): Promise<Category | undefined> {
  const db = await getDB();
  const m = await db.get('merchants', estabelecimento);
  return m?.categoria;
}

// ---------------- Inicialização / seed ----------------
//
// O IndexedDB já é criado pela função `getDB` (schema a partir da versão 1).
// `initDB` só garante que registros-padrão existam quando o armazenamento
// está vazio, evitando erros de leitura no primeiro acesso.
export async function initDB(): Promise<void> {
  const db = await getDB();

  // Segurança: garante que o registro existe (chave `seguranca`)
  let seguranca = await db.get('seguranca', 'seguranca');
  if (seguranca === undefined) {
    const config: SegurancaConfig = { pinAtivo: false, bloqueioAtivo: false };
    await db.put(
      'seguranca',
      { ...config, id: 'seguranca' } as unknown as SegurancaConfig,
    );
  }

  // Tentativas de PIN: garante que o registro existe (chave `tentativas`)
  let tentativas = await db.get('tentativas', 'tentativas');
  if (tentativas === undefined) {
    const config: TentativasBloqueio = { contador: 0 };
    await db.put(
      'tentativas',
      { ...config, id: 'tentativas' } as unknown as TentativasBloqueio,
    );
  }

  // Loja de estabelecimento -> categoria: só seed se vazio
  const merchants = await db.getAll('merchants');
  if (merchants.length === 0) {
    await db.put('merchants', { estabelecimento: '', categoria: 'outros' });
  }
}

// Utilitário de formatação (reexportado para conveniência das telas)
export { formatMoney };
