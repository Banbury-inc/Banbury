interface DateTimeContext {
  currentDate: string
  currentTime: string
  timezone: string
  isoString: string
  formatted: string
}

export function getCurrentDateTimeContext(): DateTimeContext {
  const now = new Date()
  const dateOptions: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  }
  const timeOptions: Intl.DateTimeFormatOptions = { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  }
  
  const currentDate = now.toLocaleDateString('en-US', dateOptions)
  const currentTime = now.toLocaleTimeString('en-US', timeOptions)
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const isoString = now.toISOString()
  
  return {
    currentDate,
    currentTime,
    timezone,
    isoString,
    formatted: `${currentDate} at ${currentTime} (${timezone})`
  }
}

