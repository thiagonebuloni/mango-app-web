const CORES_POR_BANCO: Record<string, string> = {
  'itaú': 'linear-gradient(135deg, #F58220 0%, #C94700 100%)',
  'nubank': 'linear-gradient(135deg, #820AD1 0%, #4F0380 100%)',
  'bradesco': 'linear-gradient(135deg, #CC092F 0%, #87001D 100%)',
  'santander': 'linear-gradient(135deg, #EC0000 0%, #870000 100%)',
  'banco do brasil': 'linear-gradient(135deg, #F7D600 0%, #F7D600 45%, #003882 46%, #003882 100%)',
  'caixa': 'linear-gradient(135deg, #0070B5 0%, #003E75 100%)',
  'inter': 'linear-gradient(135deg, #FF7A00 0%, #E84E0F 100%)',
  'c6 bank': 'linear-gradient(135deg, #292929 0%, #090909 100%)',
  'banco pan': 'linear-gradient(135deg, #F58220 0%, #005CA9 100%)',
  'picpay': 'linear-gradient(135deg, #21C25E 0%, #087A3A 100%)',
  'sicredi': 'linear-gradient(135deg, #73A333 0%, #005B2A 100%)',
  'sicoob': 'linear-gradient(135deg, #00A99D 0%, #004B50 100%)',
  'btg pactual': 'linear-gradient(135deg, #333333 0%, #101010 100%)',
};

export function cardBackgroundForBank(bank: string): string {
  const normalized = bank.trim().toLocaleLowerCase('pt-BR');
  const match = Object.keys(CORES_POR_BANCO)
    .sort((a, b) => b.length - a.length)
    .find((name) => normalized.includes(name));

  return match
    ? CORES_POR_BANCO[match]
    : 'linear-gradient(135deg, color-mix(in srgb, var(--tema-accent) 95%, white), color-mix(in srgb, var(--tema-accent) 65%, #151515))';
}
