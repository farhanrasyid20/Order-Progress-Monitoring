/** Human-readable audit timestamps, consistently displayed in Jakarta time. */
export function formatRecordedAt(value: string | null | undefined): string {
  if (!value?.trim()) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta", day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)?.value;
  return `${part("day")} ${part("month")} ${part("year")}, ${part("hour")}:${part("minute")} WIB`;
}
