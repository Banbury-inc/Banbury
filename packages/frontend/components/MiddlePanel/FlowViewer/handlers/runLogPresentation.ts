interface RunLogEntryPresentation {
  marker: string
  levelLabel: string
  content: string
  rowClassName: string
  markerClassName: string
  levelClassName: string
  textClassName: string
}

function trimLogPrefix(log: string) {
  return log.replace(/^[✓✗→]\s*/, '').trim()
}

export function getRunLogEntryPresentation(log: string): RunLogEntryPresentation {
  const line = log.trim()

  if (line.startsWith('✓')) {
    return {
      marker: '✓',
      levelLabel: 'OK',
      content: trimLogPrefix(line),
      rowClassName: 'border-border/60 bg-background/70',
      markerClassName: 'text-primary',
      levelClassName: 'text-primary',
      textClassName: 'text-foreground/90',
    }
  }

  if (line.startsWith('✗')) {
    return {
      marker: '✗',
      levelLabel: 'ERR',
      content: trimLogPrefix(line),
      rowClassName: 'border-destructive/40 bg-destructive/10',
      markerClassName: 'text-destructive',
      levelClassName: 'text-destructive',
      textClassName: 'text-destructive',
    }
  }

  if (line.startsWith('→')) {
    return {
      marker: '→',
      levelLabel: 'RUN',
      content: trimLogPrefix(line),
      rowClassName: 'border-border/60 bg-background/70',
      markerClassName: 'text-muted-foreground',
      levelClassName: 'text-muted-foreground',
      textClassName: 'text-muted-foreground',
    }
  }

  return {
    marker: '•',
    levelLabel: 'LOG',
    content: line,
    rowClassName: 'border-border/60 bg-background/70',
    markerClassName: 'text-muted-foreground',
    levelClassName: 'text-muted-foreground',
    textClassName: 'text-muted-foreground',
  }
}
