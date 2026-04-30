function splitFormattedLog(log: string): string[] {
  if (!log.trim()) return []

  const normalized = log
    .replace(/\r\n/g, '\n')
    .replace(/\s*->\s*/g, '\n→ ')
    .replace(/\s*→\s*/g, '\n→ ')
    .replace(/\s*✔\s*/g, '\n✓ ')
    .replace(/\s*✓\s*/g, '\n✓ ')
    .replace(/\s*✗\s*/g, '\n✗ ')
    .replace(/\s*❌\s*/g, '\n✗ ')
    .replace(/(\S)(Flow completed successfully\.?)/g, '$1\n$2')
    .replace(/(\S)(Flow failed\b)/g, '$1\n$2')

  return normalized
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

export function formatRunLogs(logs?: string[]): string[] {
  if (!logs?.length) return ['Flow completed successfully']

  return logs.flatMap(splitFormattedLog)
}
