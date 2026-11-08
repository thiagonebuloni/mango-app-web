import type { ModeloIa } from '../types/models';
import { formatMoney } from '../utils/format';

export type IdiomaLocalAi = 'pt-BR' | 'en-US';

export interface LocalAiStatus {
  available: boolean;
  simulationAvailable: boolean;
  reason: 'unsupported-runtime';
}

export interface LocalAiReportRequest {
  locale: IdiomaLocalAi;
  periodLabel: string;
  expensesCents: number;
  incomeCents: number;
  entryCount: number;
  leadingCategory?: { name: string; cents: number };
}

export interface LocalAiReport {
  text: string;
  simulated: true;
}

class LocalAiService {
  getStatus(): LocalAiStatus {
    return {
      available: false,
      simulationAvailable: true,
      reason: 'unsupported-runtime',
    };
  }

  async listModels(): Promise<ModeloIa[]> {
    return [];
  }

  async generateReport(request: LocalAiReportRequest): Promise<LocalAiReport> {
    const formatCurrency = (cents: number) => formatMoney(cents, request.locale);
    const balance = request.incomeCents - request.expensesCents;
    const report =
      request.locale === 'pt-BR'
        ? [
            'RELATÓRIO DEMONSTRATIVO (SIMULAÇÃO — nenhum modelo de IA foi executado)',
            `Período: ${request.periodLabel}`,
            `Lançamentos: ${request.entryCount}`,
            `Despesas: ${formatCurrency(request.expensesCents)}`,
            `Receitas: ${formatCurrency(request.incomeCents)}`,
            `Saldo: ${formatCurrency(balance)}`,
            ...(request.leadingCategory
              ? [`Maior categoria de despesa: ${request.leadingCategory.name} (${formatCurrency(request.leadingCategory.cents)})`]
              : []),
          ]
        : [
            'SAMPLE REPORT (SIMULATION — no AI model was run)',
            `Period: ${request.periodLabel}`,
            `Entries: ${request.entryCount}`,
            `Expenses: ${formatCurrency(request.expensesCents)}`,
            `Income: ${formatCurrency(request.incomeCents)}`,
            `Balance: ${formatCurrency(balance)}`,
            ...(request.leadingCategory
              ? [`Top expense category: ${request.leadingCategory.name} (${formatCurrency(request.leadingCategory.cents)})`]
              : []),
          ];

    return { text: report.join('\n'), simulated: true };
  }
}

export const localAiService = new LocalAiService();
