export type AiCreditPack = {
  id: string;
  label: string;
  credits: number;
  amountPaise: number;
};

export const AI_CREDIT_PACKS = [
  {
    id: "starter_5",
    label: "5 AI images",
    credits: 5,
    amountPaise: 4900,
  },
  {
    id: "growth_20",
    label: "20 AI images",
    credits: 20,
    amountPaise: 14900,
  },
  {
    id: "value_50",
    label: "50 AI images",
    credits: 50,
    amountPaise: 29900,
  },
] satisfies AiCreditPack[];

export function getAiCreditPack(packId: string): AiCreditPack | null {
  return AI_CREDIT_PACKS.find((pack) => pack.id === packId) ?? null;
}

export function formatPaiseAsRupees(amountPaise: number): string {
  return `₹${Math.round(amountPaise / 100)}`;
}
