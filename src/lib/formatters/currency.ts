const inrFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatInr(value: number | string | null | undefined) {
  const amount = Number(value ?? 0);

  return inrFormatter.format(Number.isFinite(amount) ? amount : 0);
}
