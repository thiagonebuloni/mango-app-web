function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (isRecord(error)) {
    const code = typeof error.code === 'string' ? error.code : undefined;
    const message = typeof error.message === 'string' ? error.message : undefined;
    const details = typeof error.details === 'string' ? error.details : undefined;
    const hint = typeof error.hint === 'string' ? error.hint : undefined;

    if (code === 'PGRST205' || message?.includes("Could not find the table 'public.user_data'")) {
      return 'A tabela public.user_data não existe no Supabase. Aplique a migration do projeto com `supabase db push` e tente novamente.';
    }

    const description = [message, details, hint && `Dica: ${hint}`].filter(Boolean).join(' — ');
    if (description) return code ? `${description} (código ${code})` : description;
  }
  return String(error);
}
