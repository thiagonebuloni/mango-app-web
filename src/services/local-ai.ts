import type { ModeloIa } from '../types/models';
import { formatMoney } from '../utils/format';

export type IdiomaLocalAi = 'pt-BR' | 'en-US';

export interface LocalAiStatus {
  available: boolean;
  ruleBasedReportAvailable: boolean;
  reason: 'model-not-loaded' | 'model-loading' | 'model-ready' | 'model-error';
  model?: string;
  loading: boolean;
}

export const LOCAL_AI_MODEL_ID = 'Xenova/LaMini-Flan-T5-77M';

let localAiStatus: LocalAiStatus = {
  available: false,
  ruleBasedReportAvailable: true,
  reason: 'model-not-loaded',
  model: LOCAL_AI_MODEL_ID,
  loading: false,
};

export function updateLocalAiStatus(status: Partial<LocalAiStatus>): void {
  localAiStatus = { ...localAiStatus, ...status };
}

export interface LocalAiReportRequest {
  locale: IdiomaLocalAi;
  periodLabel: string;
  expensesCents: number;
  incomeCents: number;
  entryCount: number;
  leadingCategory?: { name: string; cents: number };
  categoryBreakdown?: { name: string; cents: number }[];
  paymentBreakdown?: { name: string; cents: number }[];
  dailyData?: { date: string; cents: number; type: 'receita' | 'despesa' }[];
  previousPeriod?: { expensesCents: number; incomeCents: number };
}

export interface LocalAiReport {
  text: string;
  simulated: boolean;
}

function formatPct(value: number): string {
  return value.toFixed(0);
}

export function generateRuleBasedReport(request: LocalAiReportRequest): string[] {
  const pt = request.locale === 'pt-BR';
  const fc = (cents: number) => formatMoney(cents, request.locale);
  const balance = request.incomeCents - request.expensesCents;
  const lines: string[] = [];

  lines.push(
    pt ? 'RELATÓRIO GERADO POR I.A. LOCAL' : 'AI-GENERATED REPORT (LOCAL)',
    pt ? `Período: ${request.periodLabel}` : `Period: ${request.periodLabel}`,
    '',
  );

  lines.push(pt ? 'RESUMO EXECUTIVO' : 'EXECUTIVE SUMMARY');
  lines.push(
    pt ? `Lançamentos: ${request.entryCount}` : `Entries: ${request.entryCount}`,
  );
  lines.push(
    pt ? `Despesas: ${fc(request.expensesCents)}` : `Expenses: ${fc(request.expensesCents)}`,
  );
  lines.push(
    pt ? `Receitas: ${fc(request.incomeCents)}` : `Income: ${fc(request.incomeCents)}`,
  );
  lines.push(pt ? `Saldo: ${fc(balance)}` : `Balance: ${fc(balance)}`);
  if (request.leadingCategory) {
    lines.push(
      pt
        ? `Maior categoria de despesa: ${request.leadingCategory.name} (${fc(request.leadingCategory.cents)})`
        : `Top expense category: ${request.leadingCategory.name} (${fc(request.leadingCategory.cents)})`,
    );
  }
  lines.push('');

  if (request.previousPeriod) {
    const prev = request.previousPeriod;
    const prevBalance = prev.incomeCents - prev.expensesCents;
    const compare = (label: string, current: number, previous: number) => {
      if (previous <= 0) {
        return `${label}: ${fc(current)} (${pt ? 'sem base de comparação' : 'no comparison baseline'})`;
      }
      const change = ((current - previous) / previous) * 100;
      return `${label}: ${fc(current)} (${change >= 0 ? '+' : ''}${formatPct(change)}%)`;
    };
    lines.push(pt ? 'COMPARAÇÃO COM PERÍODO ANTERIOR' : 'COMPARISON WITH PREVIOUS PERIOD');
    lines.push(compare(pt ? 'Despesas' : 'Expenses', request.expensesCents, prev.expensesCents));
    lines.push(compare(pt ? 'Receitas' : 'Income', request.incomeCents, prev.incomeCents));
    const balChange = balance - prevBalance;
    lines.push(
      pt
        ? `Saldo: ${fc(balance)} (${balChange >= 0 ? '+' : '−'}${fc(Math.abs(balChange))} vs anterior)`
        : `Balance: ${fc(balance)} (${balChange >= 0 ? '+' : '−'}${fc(Math.abs(balChange))} vs previous)`,
    );
    lines.push('');
  }

  if (request.categoryBreakdown && request.categoryBreakdown.length > 0) {
    lines.push(pt ? 'DESPESAS POR CATEGORIA' : 'EXPENSES BY CATEGORY');
    const sorted = [...request.categoryBreakdown].sort((a, b) => b.cents - a.cents);
    const totalExp = request.expensesCents > 0 ? request.expensesCents : 1;
    for (const cat of sorted) {
      const pct = (cat.cents / totalExp) * 100;
      lines.push(`• ${cat.name}: ${fc(cat.cents)} (${formatPct(pct)}%)`);
    }
    lines.push('');
  }

  if (request.paymentBreakdown && request.paymentBreakdown.length > 0) {
    lines.push(pt ? 'DESPESAS POR FORMA DE PAGAMENTO' : 'EXPENSES BY PAYMENT METHOD');
    const sortedPay = [...request.paymentBreakdown].sort((a, b) => b.cents - a.cents);
    const totalPay = sortedPay.reduce((a, b) => a + b.cents, 0) || 1;
    for (const pay of sortedPay) {
      const pct = (pay.cents / totalPay) * 100;
      lines.push(`• ${pay.name}: ${fc(pay.cents)} (${formatPct(pct)}%)`);
    }
    lines.push('');
  }

  if (request.dailyData && request.dailyData.length > 0) {
    const dailyExp = request.dailyData.filter((d) => d.type === 'despesa');
    if (dailyExp.length > 0) {
      const sortedByDate = [...dailyExp].sort((a, b) => a.date.localeCompare(b.date));
      const first = sortedByDate[0].cents;
      const last = sortedByDate[sortedByDate.length - 1].cents;
      const trend = first > 0 ? ((last - first) / first) * 100 : 0;
      const arrowTrend = trend >= 0 ? '▲' : '▼';
      lines.push(pt ? 'COMPARAÇÃO ENTRE DIAS COM GASTOS' : 'SPENDING ON FIRST AND LAST RECORDED DAYS');
      lines.push(
        pt
          ? `Primeiro: ${sortedByDate[0].date} — ${fc(first)} | Último: ${sortedByDate[sortedByDate.length - 1].date} — ${fc(last)} (variação ${trend >= 0 ? '+' : ''}${formatPct(trend)}% ${arrowTrend})`
          : `First: ${sortedByDate[0].date} — ${fc(first)} | Last: ${sortedByDate[sortedByDate.length - 1].date} — ${fc(last)} (change ${trend >= 0 ? '+' : ''}${formatPct(trend)}% ${arrowTrend})`,
      );
      const peak = sortedByDate.reduce((a, b) => (b.cents > a.cents ? b : a));
      lines.push(
        pt ? `Dia com maior gasto: ${peak.date} — ${fc(peak.cents)}` : `Highest spending day: ${peak.date} — ${fc(peak.cents)}`,
      );
      lines.push('');
    }
  }

  lines.push(pt ? 'ANÁLISE E RECOMENDAÇÕES' : 'ANALYSIS AND RECOMMENDATIONS');

  if (balance > 0) {
    lines.push(
      pt
        ? `✅ Saldo positivo de ${fc(balance)}. Você está gastando menos do que recebe.`
        : `✅ Positive balance of ${fc(balance)}. You are spending less than you earn.`,
    );
  } else if (balance < 0) {
    lines.push(
      pt
        ? `⚠️ Déficit de ${fc(Math.abs(balance))}. Suas despesas superam suas receitas.`
        : `⚠️ Deficit of ${fc(Math.abs(balance))}. Your expenses exceed your income.`,
    );
  } else {
    lines.push(pt ? '➖ Receitas e despesas equilibradas.' : '➖ Income and expenses balanced.');
  }

  if (request.incomeCents <= 0) {
    lines.push(
      pt
        ? 'Não há receitas registradas; não é possível calcular a proporção entre despesas e receitas.'
        : 'No income was recorded, so the expense-to-income ratio cannot be calculated.',
    );
  } else {
    const expenseRatio = (request.expensesCents / request.incomeCents) * 100;
    lines.push(
      pt
        ? `As despesas equivalem a ${formatPct(expenseRatio)}% das receitas no período.`
        : `Expenses equal ${formatPct(expenseRatio)}% of income for this period.`,
    );
  }

  if (request.leadingCategory && request.leadingCategory.cents > 0 && request.expensesCents > 0) {
    const pct = (request.leadingCategory.cents / request.expensesCents) * 100;
    lines.push(
      pt
        ? `📌 A categoria "${request.leadingCategory.name}" concentra ${formatPct(pct)}% de suas despesas (${fc(request.leadingCategory.cents)}). Avalie se há espaço para economia aqui.`
        : `📌 The category "${request.leadingCategory.name}" concentrates ${formatPct(pct)}% of your expenses (${fc(request.leadingCategory.cents)}). Evaluate if there is room for savings here.`,
    );
  }

  if (request.entryCount === 0) {
    lines.push(
      pt ? '📭 Não há lançamentos registrados neste período.' : '📭 No entries recorded in this period.',
    );
  } else if (request.entryCount < 5) {
    lines.push(
      pt ? '📝 Poucos lançamentos registrados; acompanhe mais de perto seus gastos.' : '📝 Few entries recorded; track your spending more closely.',
    );
  }

  lines.push('');
  lines.push(
    pt
      ? 'A análise do modelo pode conter imprecisões. Os totais são calculados a partir dos lançamentos e não substituem aconselhamento profissional.'
      : 'The model analysis may be inaccurate. Totals are calculated from your entries and do not replace professional advice.',
  );

  return lines;
}

class LocalAiService {
  constructor() {}

  getStatus(): LocalAiStatus {
    return { ...localAiStatus };
  }

  async listModels(): Promise<ModeloIa[]> {
    return [];
  }

  async generateReport(request: LocalAiReportRequest): Promise<LocalAiReport> {
    const ruleLines = generateRuleBasedReport(request);

    return {
      text: ruleLines.join('\n'),
      simulated: true,
    };
  }
}

export const localAiService = new LocalAiService();
