// Store de estado global com Zustand (substitui o Riverpod do Flutter).
// Sincroniza com o IndexedDB via src/services/db.ts.
import { create } from 'zustand';
import { initDB } from '../services/db';
import type {
  Expense,
  ExpenseInput,
  CartaoCredito,
  CartaoCreditoInput,
  UserProfile,
  SegurancaConfig,
  TentativasBloqueio,
} from '../types/models';
import {
  allExpenses,
  insertExpense,
  updateExpense,
  deleteExpense,
  allCartoes,
  insertCartao,
  updateCartao,
  deleteCartao,
  loadProfile,
  loadDataSnapshot,
  saveProfile,
  loadSeguranca,
  saveSeguranca,
  loadTentativas,
  saveTentativas,
  deleteLocalDatabase,
} from '../services/db';
import {
  connectAccountData,
  requestAccountDeletion,
  syncAccountData,
} from '../services/cloud-sync';
import { supabase, supabaseConfigured } from '../services/supabase';
import { errorMessage } from '../services/error-message';


// ---------- Tipos de mês ----------

export type MesSelecionado = {
  gastos: string; // YYYY-MM
  cartoes: string; // YYYY-MM
};

export type SyncStatus = 'local' | 'syncing' | 'synced' | 'pending' | 'error';

// ---------- Store ----------

interface MangoState {
  // Dados
  despesas: Expense[];
  despesasLoading: boolean;
  cartoes: CartaoCredito[];
  cartoesLoading: boolean;
  perfil: UserProfile | null;
  perfilLoading: boolean;
  seguranca: SegurancaConfig | null;
  tentativas: TentativasBloqueio;
  meses: MesSelecionado;
  idioma: 'pt-BR' | 'en-US';
  definirIdioma: (idioma: 'pt-BR' | 'en-US') => void;
  userId: string | null;
  syncStatus: SyncStatus;
  syncError: string | null;
  conectarConta: (userId: string) => Promise<void>;
  sincronizarAgora: () => Promise<void>;
  apagarConta: () => Promise<void>;

  // Ações — Despesas
  carregarDespesas: () => Promise<void>;
  adicionarDespesa: (input: ExpenseInput) => Promise<number>;
  editarDespesa: (expense: Expense) => Promise<void>;
  excluirDespesa: (id: number) => Promise<void>;
  despesasDoMes: (mes: string) => Expense[];

  // Ações — Cartões
  carregarCartoes: () => Promise<void>;
  adicionarCartao: (input: CartaoCreditoInput) => Promise<number>;
  editarCartao: (cartao: CartaoCredito) => Promise<void>;
  excluirCartao: (id: number) => Promise<void>;

  // Ações — Perfil
  carregarPerfil: () => Promise<void>;
  salvarPerfil: (perfil: UserProfile) => Promise<void>;

  // Ações — Segurança
  carregarSeguranca: () => Promise<void>;
  salvarSeguranca: (config: SegurancaConfig) => Promise<void>;
  carregarTentativas: () => Promise<void>;
  salvarTentativas: (t: TentativasBloqueio) => Promise<void>;

  // Ações — Mês
  definirMesGastos: (mes: string) => void;
  definirMesCartoes: (mes: string) => void;
}

const mesInicial: MesSelecionado = {
  gastos: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
  cartoes: `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`,
};

const idiomaInicial: 'pt-BR' | 'en-US' = 'pt-BR';

export const useMangoStore = create<MangoState>((set, get) => ({
  // Estado inicial
  despesas: [],
  despesasLoading: false,
  cartoes: [],
  cartoesLoading: false,
  perfil: null,
  perfilLoading: true,
  seguranca: null,
  tentativas: { contador: 0 },
  meses: mesInicial,
  idioma: idiomaInicial,
  definirIdioma: (idioma) => set({ idioma }),
  userId: null,
  syncStatus: 'local',
  syncError: null,

  conectarConta: async (userId) => {
    set({ userId, syncStatus: 'syncing', syncError: null });
    try {
      await connectAccountData(userId);
      const {
        expenses,
        cartoes,
        perfil,
        seguranca,
        tentativas,
      } = await loadDataSnapshot();
      set({
        despesas: expenses,
        cartoes,
        perfil,
        idioma: perfil?.idioma ?? idiomaInicial,
        seguranca,
        tentativas,
        despesasLoading: false,
        cartoesLoading: false,
        perfilLoading: false,
        syncStatus: 'synced',
      });
    } catch (error) {
      console.error('Erro ao conectar os dados da conta:', error);
      set({ syncStatus: 'error', syncError: errorMessage(error) });
      throw error;
    }
  },

  sincronizarAgora: async () => {
    const { userId } = get();
    if (!supabaseConfigured || !userId) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      localStorage.setItem('mango_sync_pending', 'true');
      set({ syncStatus: 'pending', syncError: null });
      return;
    }
    set({ syncStatus: 'syncing', syncError: null });
    try {
      await syncAccountData(userId);
      set({ syncStatus: 'synced', syncError: null });
    } catch (error) {
      console.error('Erro ao sincronizar os dados com o Supabase:', error);
      set({
        syncStatus: 'pending',
        syncError: errorMessage(error),
      });
    }
  },

  apagarConta: async () => {
    const { userId } = get();
    if (supabaseConfigured) {
      if (!userId) throw new Error('Faça login novamente para apagar esta conta.');
      await requestAccountDeletion();
    }
    await deleteLocalDatabase();
    set({
      despesas: [],
      cartoes: [],
      perfil: null,
      seguranca: null,
      tentativas: { contador: 0 },
      userId: null,
      syncStatus: 'local',
      syncError: null,
    });
    if (supabase) {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    }
  },

  // ---------- Despesas ----------

  carregarDespesas: async () => {
    set({ despesasLoading: true });
    try {
      const despesas = await allExpenses();
      set({ despesas, despesasLoading: false });
    } catch (e) {
      console.error('Erro ao carregar despesas:', e);
      set({ despesasLoading: false });
    }
  },

  adicionarDespesa: async (input) => {
    const id = await insertExpense(input);
    await get().carregarDespesas();
    await get().sincronizarAgora();
    return id;
  },

  editarDespesa: async (expense) => {
    await updateExpense(expense);
    await get().carregarDespesas();
    await get().sincronizarAgora();
  },

  excluirDespesa: async (id) => {
    await deleteExpense(id);
    await get().carregarDespesas();
    await get().sincronizarAgora();
  },

  despesasDoMes: (mes) => {
    const { despesas } = get();
    return despesas.filter((e) => e.data.startsWith(mes));
  },

  // ---------- Cartões ----------

  carregarCartoes: async () => {
    set({ cartoesLoading: true });
    try {
      const cartoes = await allCartoes();
      set({ cartoes, cartoesLoading: false });
    } catch (e) {
      console.error('Erro ao carregar cartões:', e);
      set({ cartoesLoading: false });
    }
  },

  adicionarCartao: async (input) => {
    const id = await insertCartao(input);
    await get().carregarCartoes();
    await get().sincronizarAgora();
    return id;
  },

  editarCartao: async (cartao) => {
    await updateCartao(cartao);
    await get().carregarCartoes();
    await get().sincronizarAgora();
  },

  excluirCartao: async (id) => {
    await deleteCartao(id);
    await get().carregarCartoes();
    await get().sincronizarAgora();
  },

  // ---------- Perfil ----------

  carregarPerfil: async () => {
    try {
      const perfil = await loadProfile();
      set({ perfil, idioma: perfil?.idioma ?? idiomaInicial, perfilLoading: false });
    } catch (e) {
      console.error('Erro ao carregar perfil:', e);
      set({ perfilLoading: false });
    }
  },

  salvarPerfil: async (perfil) => {
    await saveProfile(perfil);
    set({ perfil, idioma: perfil.idioma ?? idiomaInicial });
    await get().sincronizarAgora();
  },

  // ---------- Segurança ----------

  carregarSeguranca: async () => {
    try {
      const seguranca = await loadSeguranca();
      set({ seguranca });
    } catch (e) {
      console.error('Erro ao carregar segurança:', e);
    }
  },

  salvarSeguranca: async (config) => {
    await saveSeguranca(config);
    set({ seguranca: config });
    await get().sincronizarAgora();
  },

  carregarTentativas: async () => {
    try {
      const tentativas = await loadTentativas();
      set({ tentativas });
    } catch (e) {
      console.error('Erro ao carregar tentativas:', e);
    }
  },

  salvarTentativas: async (t) => {
    await saveTentativas(t);
    set({ tentativas: t });
    await get().sincronizarAgora();
  },

  // ---------- Mês ----------

  definirMesGastos: (mes) => set((state) => ({ meses: { ...state.meses, gastos: mes } })),
  definirMesCartoes: (mes) => set((state) => ({ meses: { ...state.meses, cartoes: mes } })),
}));

// ---------- Inicialização assíncrona ----------

export async function inicializarStore() {
  await initDB();
  const store = useMangoStore.getState();
  await Promise.all([
    store.carregarDespesas(),
    store.carregarCartoes(),
    store.carregarPerfil(),
    store.carregarSeguranca(),
    store.carregarTentativas(),
  ]);
}
