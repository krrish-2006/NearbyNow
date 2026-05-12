const CHEAP_SEARCH_TERMS = [
  "cheap",
  "cheapest",
  "budget",
  "low price",
  "low-price",
  "affordable",
  "sasta",
  "sasti",
  "saste",
  "सस्ता",
  "सस्ती",
  "सस्ते",
  "কম দাম",
  "சஸ்தா",
  "ਚੀਪ",
];

const MAX_PRICE_PATTERNS = [
  /\b(?:under|below|less than|within|upto|up to|<=|<)\s*(?:rs\.?|inr|₹)?\s*(\d+(?:\.\d+)?)/i,
  /\b(?:rs\.?|inr|₹)\s*(\d+(?:\.\d+)?)\s*(?:or less|and below|tak|तक|के अंदर|से कम)?/i,
  /\b(\d+(?:\.\d+)?)\s*(?:ke andar|ke niche|se kam|tak|तक|के अंदर|से कम|এর মধ্যে|এর নিচে)\b/i,
];

export type ParsedMarketplaceSearchQuery = {
  cleanedSearch: string;
  maxPrice: number | null;
  preferCheap: boolean;
};

export function parseMarketplaceSearchQuery(
  search: string,
): ParsedMarketplaceSearchQuery {
  const cleanedSearch = search.trim().replace(/\s+/g, " ");
  const lowerSearch = cleanedSearch.toLowerCase();

  const maxPrice = MAX_PRICE_PATTERNS.reduce<number | null>(
    (foundPrice, pattern) => {
      if (foundPrice !== null) {
        return foundPrice;
      }

      const match = lowerSearch.match(pattern);
      const parsedPrice = match?.[1] ? Number(match[1]) : NaN;

      return Number.isFinite(parsedPrice) && parsedPrice >= 0
        ? parsedPrice
        : null;
    },
    null,
  );

  return {
    cleanedSearch,
    maxPrice,
    preferCheap: CHEAP_SEARCH_TERMS.some((term) => lowerSearch.includes(term)),
  };
}
