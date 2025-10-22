import { tool } from "@langchain/core/tools"
import { z } from "zod"

// Tool to get current date/time information
export const getCurrentDateTimeTool = tool(
  async () => {
    const now = new Date()
    
    // Format current date and time
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
    
    return JSON.stringify({
      currentDate,
      currentTime,
      timezone,
      isoString,
      formatted: `${currentDate} at ${currentTime} (${timezone})`,
      unixTimestamp: Math.floor(now.getTime() / 1000),
      year: now.getFullYear(),
      month: now.getMonth() + 1, // 1-based month
      day: now.getDate(),
      hour: now.getHours(),
      minute: now.getMinutes(),
      dayOfWeek: now.getDay(), // 0 = Sunday, 1 = Monday, etc.
      dayOfYear: Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24))
    })
  },
  {
    name: "get_current_datetime",
    description: "Get the current date and time information including formatted strings, timestamps, and individual components.",
    schema: z.object({})
  }
)

