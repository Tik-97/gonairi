export function formatMoney(amount: number | string, currency: string = "AMD"): string {
  const value = typeof amount === "string" ? Number(amount) : amount;
  return new Intl.NumberFormat("hy-AM", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "AMD" ? 0 : 2,
  }).format(value);
}

export function formatDate(date: Date | string): string {
  const value = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Yerevan",
  }).format(value);
}
