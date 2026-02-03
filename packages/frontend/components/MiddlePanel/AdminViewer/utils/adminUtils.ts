// Utility function to convert UTC timestamp to Eastern time
export const convertToEasternTime = (timestamp: string): string => {
  try {
    // All timestamps from backend are now in UTC
    // If no timezone info, assume UTC and add 'Z'
    const utcTimestamp = timestamp.includes('Z') || timestamp.includes('+') || timestamp.includes('-')
      ? timestamp
      : timestamp + 'Z'

    const date = new Date(utcTimestamp)

    return date.toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  } catch (error) {
    console.error('Error converting timestamp to Eastern time:', error)
    return timestamp // Fallback to original timestamp
  }
}

// Utility function to format bytes into human readable format
export const formatBytes = (bytes: number, decimals: number = 2): string => {
  if (bytes === 0) return '0 B'

  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i]
}
