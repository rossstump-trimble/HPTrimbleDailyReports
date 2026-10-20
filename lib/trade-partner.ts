export interface NamedTradePartner {
  id: string;
  name: string;
}

export function slugTradePartnerId(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return slug || 'unknown-trade';
}

export function resolveTradePartner(
  name: string | undefined,
  partners: NamedTradePartner[],
  current?: { id: string; name: string },
): { tradePartnerId: string; tradePartnerName: string } {
  const raw = name ?? '';
  const trimmed = raw.trim();
  if (trimmed) {
    const match = partners.find((tp) => tp.name.toLowerCase() === trimmed.toLowerCase());
    if (match) {
      const hasTrailingSpace = raw.endsWith(' ') || raw.startsWith(' ');
      return {
        tradePartnerId: match.id,
        tradePartnerName: hasTrailingSpace ? raw : match.name,
      };
    }
    return { tradePartnerId: slugTradePartnerId(trimmed), tradePartnerName: raw };
  }
  if (current?.id) {
    return { tradePartnerId: current.id, tradePartnerName: current.name };
  }
  return { tradePartnerId: '', tradePartnerName: raw };
}
