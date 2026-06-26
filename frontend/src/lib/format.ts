export function formatLogTimestamp(iso: string): string {
  return iso.replace("T", " ").replace("Z", "");
}

export function shortLogId(logId: string): string {
  const parts = logId.split(":");
  return parts.length > 1 ? `:${parts[parts.length - 1]}` : logId;
}
