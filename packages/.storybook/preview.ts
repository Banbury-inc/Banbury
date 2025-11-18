import React, { useEffect } from "react"
import type { Preview } from "@storybook/react"
import { ThemeProvider } from "../src/components/ThemeProvider"
import { ApiService } from "../src/services/apiService"
import { ScopeService } from "../src/services/scopeService"
import { EmailService } from "../src/services/emailService"
import { CalendarService } from "../src/services/calendarService"
import { DriveService } from "../src/services/driveService"
import "../src/index.css"

// Storybook integration state management
interface StorybookIntegrationState {
  gmail: boolean
  calendar: boolean
  drive: boolean
}

// Global state for Storybook (can be modified per story)
if (typeof window !== 'undefined') {
  (window as any).__STORYBOOK_INTEGRATION_STATE__ = {
    gmail: false,
    calendar: false,
    drive: false,
  }
}

// Helper to get integration state
function getIntegrationState(): StorybookIntegrationState {
  if (typeof window !== 'undefined') {
    return (window as any).__STORYBOOK_INTEGRATION_STATE__ || { gmail: false, calendar: false, drive: false }
  }
  return { gmail: false, calendar: false, drive: false }
}

// Mock API services for Storybook
if (typeof window !== 'undefined') {
  // Mock getUserFiles to return sample data
  ApiService.getUserFiles = async (username: string) => {
    return {
      success: true,
      files: [
        {
          file_id: 'file-1',
          file_name: 'Project Proposal.docx',
          file_path: '/documents/Project Proposal.docx',
          file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          file_size: 524288,
          date_uploaded: new Date().toISOString(),
          date_modified: new Date().toISOString(),
          s3_url: 'https://example.com/file1',
          device_name: 'Storybook'
        },
        {
          file_id: 'file-2',
          file_name: 'Budget.xlsx',
          file_path: '/documents/Budget.xlsx',
          file_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          file_size: 102400,
          date_uploaded: new Date().toISOString(),
          date_modified: new Date().toISOString(),
          s3_url: 'https://example.com/file2',
          device_name: 'Storybook'
        },
        {
          file_id: 'file-3',
          file_name: 'Meeting Notes.txt',
          file_path: '/notes/Meeting Notes.txt',
          file_type: 'text/plain',
          file_size: 2048,
          date_uploaded: new Date().toISOString(),
          date_modified: new Date().toISOString(),
          s3_url: 'https://example.com/file3',
          device_name: 'Storybook'
        },
        {
          file_id: 'file-4',
          file_name: 'Presentation.pptx',
          file_path: '/presentations/Presentation.pptx',
          file_type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          file_size: 1048576,
          date_uploaded: new Date().toISOString(),
          date_modified: new Date().toISOString(),
          s3_url: 'https://example.com/file4',
          device_name: 'Storybook'
        },
        {
          file_id: 'file-5',
          file_name: 'data.csv',
          file_path: '/data/data.csv',
          file_type: 'text/csv',
          file_size: 8192,
          date_uploaded: new Date().toISOString(),
          date_modified: new Date().toISOString(),
          s3_url: 'https://example.com/file5',
          device_name: 'Storybook'
        }
      ]
    }
  }
  
  // Mock ScopeService to check integration state
  ScopeService.isFeatureAvailable = async (feature: string) => {
    const state = getIntegrationState()
    if (feature === 'gmail') return state.gmail
    if (feature === 'calendar') return state.calendar
    if (feature === 'drive') return state.drive
    return false
  }
  
  // Mock EmailService.listMessages to return sample emails
  EmailService.listMessages = async (params?: { labelIds?: string[]; maxResults?: number; pageToken?: string; q?: string }) => {
    const state = getIntegrationState()
    if (!state.gmail) {
      throw new Error('Gmail not available')
    }
    
    const baseMessages = [
      {
        id: 'msg-1',
        threadId: 'thread-1',
        labelIds: ['INBOX', 'UNREAD'],
        snippet: 'Hey, can we schedule a meeting for next week to discuss the project roadmap?',
        internalDate: new Date(Date.now() - 2 * 60 * 60 * 1000).getTime().toString(),
        payload: {
          headers: [
            { name: 'From', value: 'John Doe <john@example.com>' },
            { name: 'To', value: 'me@example.com' },
            { name: 'Subject', value: 'Project Meeting Request' },
            { name: 'Date', value: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() }
          ],
          body: { data: btoa('Hey, can we schedule a meeting for next week to discuss the project roadmap?') }
        }
      },
      {
        id: 'msg-2',
        threadId: 'thread-2',
        labelIds: ['INBOX'],
        snippet: 'The Q4 financial report is ready for your review. Please let me know if you have any questions.',
        internalDate: new Date(Date.now() - 24 * 60 * 60 * 1000).getTime().toString(),
        payload: {
          headers: [
            { name: 'From', value: 'Finance Team <finance@company.com>' },
            { name: 'To', value: 'me@example.com' },
            { name: 'Subject', value: 'Q4 Financial Report' },
            { name: 'Date', value: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
          ],
          body: { data: btoa('The Q4 financial report is ready for your review. Please let me know if you have any questions.') }
        }
      },
      {
        id: 'msg-3',
        threadId: 'thread-3',
        labelIds: ['INBOX', 'STARRED'],
        snippet: 'Your order #12345 has been shipped and will arrive in 2-3 business days.',
        internalDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).getTime().toString(),
        payload: {
          headers: [
            { name: 'From', value: 'Orders <noreply@shop.com>' },
            { name: 'To', value: 'me@example.com' },
            { name: 'Subject', value: 'Your Order Has Shipped!' },
            { name: 'Date', value: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          body: { data: btoa('Your order #12345 has been shipped and will arrive in 2-3 business days.') }
        }
      },
      {
        id: 'msg-4',
        threadId: 'thread-4',
        labelIds: ['SENT'],
        snippet: 'Thanks for the update. I\'ll review the documents and get back to you by tomorrow.',
        internalDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).getTime().toString(),
        payload: {
          headers: [
            { name: 'From', value: 'me@example.com' },
            { name: 'To', value: 'colleague@company.com' },
            { name: 'Subject', value: 'Re: Document Review' },
            { name: 'Date', value: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() }
          ],
          body: { data: btoa('Thanks for the update. I\'ll review the documents and get back to you by tomorrow.') }
        }
      }
    ]
    
    // Filter by label
    let filteredMessages = baseMessages
    if (params?.labelIds && params.labelIds.length > 0) {
      filteredMessages = baseMessages.filter(msg => 
        params.labelIds!.some(label => msg.labelIds?.includes(label))
      )
    }
    
    // Apply search query
    if (params?.q) {
      const query = params.q.toLowerCase()
      filteredMessages = filteredMessages.filter(msg =>
        msg.snippet.toLowerCase().includes(query) ||
        msg.payload?.headers?.some((h: any) => 
          h.value.toLowerCase().includes(query)
        )
      )
    }
    
    return {
      messages: filteredMessages.slice(0, params?.maxResults || 50),
      resultSizeEstimate: filteredMessages.length
    }
  }
  
  // Mock EmailService.getMessage to return full message
  EmailService.getMessage = async (messageId: string) => {
    const listResponse = await EmailService.listMessages()
    const message = listResponse.messages?.find(m => m.id === messageId)
    if (!message) {
      throw new Error('Message not found')
    }
    return message as any
  }
  
  // Mock CalendarService.listEvents to return sample events
  CalendarService.listEvents = async (params?: { calendarId?: string; timeMin?: string; timeMax?: string; maxResults?: number; pageToken?: string; query?: string; singleEvents?: boolean; orderBy?: 'startTime' | 'updated' }) => {
    const state = getIntegrationState()
    if (!state.calendar) {
      throw new Error('Calendar not available')
    }
    
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    const nextWeek = new Date(now)
    nextWeek.setDate(nextWeek.getDate() + 7)
    
    const events = [
      {
        id: 'event-1',
        status: 'confirmed',
        summary: 'Team Standup',
        description: 'Daily team sync meeting',
        location: 'Conference Room A',
        start: { dateTime: new Date(now.setHours(9, 0, 0, 0)).toISOString(), timeZone: 'America/New_York' },
        end: { dateTime: new Date(now.setHours(9, 30, 0, 0)).toISOString(), timeZone: 'America/New_York' },
        creator: { email: 'manager@company.com', displayName: 'Sarah Manager' },
        organizer: { email: 'manager@company.com', displayName: 'Sarah Manager' },
        attendees: [
          { email: 'me@example.com', displayName: 'Me', responseStatus: 'accepted' },
          { email: 'colleague@company.com', displayName: 'John Colleague', responseStatus: 'accepted' }
        ]
      },
      {
        id: 'event-2',
        status: 'confirmed',
        summary: 'Client Presentation',
        description: 'Q4 results presentation for BigCorp client',
        location: 'Virtual - Google Meet',
        hangoutLink: 'https://meet.google.com/abc-defg-hij',
        start: { dateTime: tomorrow.setHours(14, 0, 0, 0).toString(), timeZone: 'America/New_York' },
        end: { dateTime: new Date(tomorrow.getTime() + 60 * 60 * 1000).toISOString(), timeZone: 'America/New_York' },
        creator: { email: 'me@example.com', displayName: 'Me' },
        organizer: { email: 'me@example.com', displayName: 'Me' },
        attendees: [
          { email: 'client@bigcorp.com', displayName: 'Client Contact', responseStatus: 'tentative' }
        ]
      },
      {
        id: 'event-3',
        status: 'confirmed',
        summary: 'Project Planning Session',
        description: 'Planning for next quarter initiatives',
        location: 'Conference Room B',
        start: { dateTime: nextWeek.setHours(10, 0, 0, 0).toString(), timeZone: 'America/New_York' },
        end: { dateTime: new Date(nextWeek.getTime() + 2 * 60 * 60 * 1000).toISOString(), timeZone: 'America/New_York' },
        creator: { email: 'manager@company.com', displayName: 'Sarah Manager' },
        organizer: { email: 'manager@company.com', displayName: 'Sarah Manager' },
        attendees: [
          { email: 'me@example.com', displayName: 'Me', responseStatus: 'needsAction' },
          { email: 'team1@company.com', displayName: 'Team Member 1', responseStatus: 'accepted' },
          { email: 'team2@company.com', displayName: 'Team Member 2', responseStatus: 'accepted' }
        ]
      }
    ]
    
    return {
      items: events.slice(0, params?.maxResults || 50)
    }
  }
  
  // Mock DriveService.listRootFiles
  DriveService.listRootFiles = async (pageSize?: number, pageToken?: string) => {
    const state = getIntegrationState()
    if (!state.drive) {
      throw new Error('Drive not available')
    }
    
    return {
      files: [
        {
          id: 'drive-folder-1',
          name: 'Work Documents',
          mimeType: 'application/vnd.google-apps.folder',
          modifiedTime: new Date().toISOString(),
          size: undefined,
          webViewLink: 'https://drive.google.com/drive/folders/abc123'
        },
        {
          id: 'drive-doc-1',
          name: 'Meeting Notes 2024',
          mimeType: 'application/vnd.google-apps.document',
          modifiedTime: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          size: '15360',
          webViewLink: 'https://docs.google.com/document/d/abc123'
        },
        {
          id: 'drive-sheet-1',
          name: 'Budget Tracker',
          mimeType: 'application/vnd.google-apps.spreadsheet',
          modifiedTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          size: '28672',
          webViewLink: 'https://docs.google.com/spreadsheets/d/abc123'
        }
      ]
    }
  }
}

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: "^on[A-Z].*" },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/
      }
    },
    backgrounds: {
      disable: true // Disable storybook backgrounds, use theme instead
    },
    layout: "fullscreen"
  },
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "dark",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: ["light", "dark"],
        dynamicTitle: true
      }
    }
  },
  decorators: [
    (Story, context) => {
      const theme = context.globals.theme || "dark"
      
      useEffect(() => {
        const root = document.documentElement
        const body = document.body
        
        if (theme === "dark") {
          root.classList.add("dark")
        } else {
          root.classList.remove("dark")
        }
        
        // Remove body styles for transparent background
        body.className = "text-foreground"
        body.style.backgroundColor = "transparent"
        
        // Add a style tag to override any CSS background rules
        let styleTag = document.getElementById("storybook-bg-override")
        if (!styleTag) {
          styleTag = document.createElement("style")
          styleTag.id = "storybook-bg-override"
          styleTag.innerHTML = `
            body, html, #storybook-root {
              background-color: transparent !important;
              background: transparent !important;
            }
          `
          document.head.appendChild(styleTag)
        }
      }, [theme])

      return React.createElement(
        ThemeProvider,
        {
          attribute: "class",
          defaultTheme: theme,
          enableSystem: false,
          storageKey: "storybook-theme-mode",
          forcedTheme: theme
        },
        React.createElement("div", { className: "text-foreground" }, React.createElement(Story))
      )
    }
  ]
}

export default preview


