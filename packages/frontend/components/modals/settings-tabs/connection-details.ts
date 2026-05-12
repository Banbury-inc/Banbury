export interface ConnectionTool {
  name: string
  description: string
}

export interface ConnectionMetadata {
  id: ConnectionId
  name: string
  category: string
  description: string
  preferenceKeys: string[]
  capabilities: string[]
  tools: ConnectionTool[]
  setupNotes: string[]
}

export type ConnectionId =
  | 'slack'
  | 'github'
  | 'outlook'
  | 'teams'
  | 'x'
  | 'onedrive'
  | 'dropbox'
  | 'notion'
  | 'google-drive'
  | 'gmail'
  | 'google-calendar'
  | 'profile-information'

export const connectionDetails: ConnectionMetadata[] = [
  {
    id: 'profile-information',
    name: 'Profile Information',
    category: 'Google account',
    description: 'Use basic Google profile information to identify your account and personalize your Banbury workspace.',
    preferenceKeys: [],
    capabilities: [
      'Read your Google profile name and email address during authentication',
      'Keep account identity available for profile and workspace context',
      'Support required Google sign-in metadata without extra activation',
    ],
    tools: [],
    setupNotes: [
      'Profile information is part of the required Google sign-in scopes.',
      'This entry is informational and does not expose a separate connect or disconnect action.',
    ],
  },
  {
    id: 'google-drive',
    name: 'Google Drive',
    category: 'Cloud storage',
    description: 'Activate Google Drive access so Banbury can browse, open, save, and organize files from your Drive.',
    preferenceKeys: [],
    capabilities: [
      'Browse files and folders from Google Drive in the Files panel',
      'Open Drive documents, spreadsheets, presentations, PDFs, images, and videos in Banbury viewers',
      'Save supported edited files back to Google Drive',
      'Copy local or cloud files into Google Drive when available',
    ],
    tools: [],
    setupNotes: [
      'Activate Google Drive to grant incremental Drive scopes.',
      'No dedicated composer tool toggle is currently exposed for Google Drive.',
    ],
  },
  {
    id: 'gmail',
    name: 'Gmail',
    category: 'Email',
    description: 'Activate Gmail access so the assistant can retrieve, search, inspect, label, and send messages when enabled.',
    preferenceKeys: ['gmail', 'gmailSend'],
    capabilities: [
      'Fetch recent inbox messages for review and summarization',
      'Search messages with Gmail query syntax',
      'Retrieve full message content before acting',
      'Send emails when the Gmail Send Email tool preference is enabled',
    ],
    tools: [
      {
        name: 'gmail_get_recent',
        description: 'Fetch recent messages from Gmail',
      },
      {
        name: 'gmail_search',
        description: 'Search Gmail messages using Gmail query syntax',
      },
      {
        name: 'gmail_get_message',
        description: 'Retrieve a specific Gmail message with full content',
      },
      {
        name: 'gmail_send_message',
        description: 'Send an email from Gmail when sending is enabled',
      },
      {
        name: 'gmail_label_email',
        description: 'Apply labels to Gmail messages',
      },
    ],
    setupNotes: [
      'Activate Gmail to grant incremental Gmail scopes.',
      'Assistant use can still be disabled from tool preferences with the Gmail and Gmail Send Email toggles.',
    ],
  },
  {
    id: 'google-calendar',
    name: 'Google Calendar',
    category: 'Calendar',
    description: 'Activate Google Calendar access so the assistant can inspect and manage events from your Google calendars.',
    preferenceKeys: ['calendar'],
    capabilities: [
      'List calendar events by time range',
      'Fetch event details before making changes',
      'Create new calendar events',
      'Update or delete existing events when requested',
    ],
    tools: [
      {
        name: 'calendar_list_events',
        description: 'List Google Calendar events',
      },
      {
        name: 'calendar_get_event',
        description: 'Get a specific Google Calendar event',
      },
      {
        name: 'calendar_create_event',
        description: 'Create a new Google Calendar event',
      },
      {
        name: 'calendar_update_event',
        description: 'Update an existing Google Calendar event',
      },
      {
        name: 'calendar_delete_event',
        description: 'Delete a Google Calendar event',
      },
    ],
    setupNotes: [
      'Activate Google Calendar to grant incremental calendar scopes.',
      'Assistant use can still be disabled from tool preferences with the Google Calendar toggle.',
    ],
  },
  {
    id: 'slack',
    name: 'Slack',
    category: 'Team communication',
    description: 'Let the assistant find channels, read conversations, search messages, and send updates in your Slack workspace.',
    preferenceKeys: ['slack'],
    capabilities: [
      'Find channels and user context before taking action',
      'Read recent channel history and thread replies',
      'Search workspace messages with Slack query syntax',
      'Send messages and add reactions from your connected account',
    ],
    tools: [
      {
        name: 'slack_list_channels',
        description: 'List all Slack channels the user has access to',
      },
      {
        name: 'slack_send_message',
        description: 'Send a message to a Slack channel and optionally reply to a thread',
      },
      {
        name: 'slack_get_channel_history',
        description: 'Get message history from a Slack channel',
      },
      {
        name: 'slack_get_thread_replies',
        description: 'Get all replies in a specific Slack thread',
      },
      {
        name: 'slack_search_messages',
        description: 'Search messages across Slack channels using query syntax',
      },
      {
        name: 'slack_get_user_info',
        description: 'Get information about a Slack user by user ID',
      },
      {
        name: 'slack_set_channel_topic',
        description: 'Set or update the topic for a Slack channel',
      },
      {
        name: 'slack_add_reaction',
        description: 'Add an emoji reaction to a Slack message',
      },
    ],
    setupNotes: [
      'Connect Slack to authorize workspace access.',
      'Assistant use can still be disabled from tool preferences with the Slack toggle.',
    ],
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'Development',
    description: 'Give the assistant repository context so it can inspect repos, issues, pull requests, and code search results.',
    preferenceKeys: ['github'],
    capabilities: [
      'List and inspect repositories you can access',
      'Review issues and pull requests by repository',
      'Create issues from assistant workflows',
      'Read file contents and search code across GitHub',
    ],
    tools: [
      {
        name: 'github_list_repos',
        description: 'List GitHub repositories for the authenticated user',
      },
      {
        name: 'github_get_repo',
        description: 'Get detailed information about a specific GitHub repository',
      },
      {
        name: 'github_list_issues',
        description: 'List issues for a GitHub repository',
      },
      {
        name: 'github_create_issue',
        description: 'Create a new issue in a GitHub repository',
      },
      {
        name: 'github_list_pull_requests',
        description: 'List pull requests for a GitHub repository',
      },
      {
        name: 'github_get_file_contents',
        description: 'Get decoded file contents from a GitHub repository',
      },
      {
        name: 'github_search_code',
        description: 'Search for code across GitHub repositories',
      },
    ],
    setupNotes: [
      'Connect GitHub to authorize repository access.',
      'Assistant use can still be disabled from tool preferences with the GitHub toggle.',
    ],
  },
  {
    id: 'outlook',
    name: 'Outlook',
    category: 'Microsoft 365',
    description: 'Connect Outlook through Microsoft Graph so the assistant can help with Outlook Calendar and email-related Microsoft 365 context.',
    preferenceKeys: ['msCalendar'],
    capabilities: [
      'List available Outlook calendars',
      'Find calendar events by time range or query',
      'Create, update, and delete calendar events',
      'Fetch event details before making changes',
    ],
    tools: [
      {
        name: 'ms_calendar_list_calendars',
        description: 'List all Microsoft Outlook calendars for the connected user',
      },
      {
        name: 'ms_calendar_list_events',
        description: 'List Outlook Calendar events with optional filters',
      },
      {
        name: 'ms_calendar_get_event',
        description: 'Get a specific Outlook Calendar event by ID',
      },
      {
        name: 'ms_calendar_create_event',
        description: 'Create a new Outlook Calendar event',
      },
      {
        name: 'ms_calendar_update_event',
        description: 'Update an existing Outlook Calendar event',
      },
      {
        name: 'ms_calendar_delete_event',
        description: 'Delete an Outlook Calendar event by ID',
      },
    ],
    setupNotes: [
      'Connect Outlook to authorize Microsoft Graph access for Outlook Calendar.',
      'Assistant use can still be disabled from tool preferences with the Microsoft Calendar toggle.',
    ],
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    category: 'Microsoft 365',
    description: 'Use the existing Microsoft Graph connection so the assistant can read Teams context and send Teams messages when enabled.',
    preferenceKeys: ['teams'],
    capabilities: [
      'List joined Teams, channels, members, chats, channel messages, and replies',
      'Fetch Teams channel message details before responding',
      'Send Teams channel messages and replies from your connected Microsoft account',
      'Reuse the same Microsoft Graph OAuth connection and credentials as Outlook',
    ],
    tools: [
      {
        name: 'ms_teams_list_teams',
        description: 'List Microsoft Teams joined by the connected account',
      },
      {
        name: 'ms_teams_list_channels',
        description: 'List channels in a Microsoft Team',
      },
      {
        name: 'ms_teams_list_channel_messages',
        description: 'Read recent messages from a Teams channel',
      },
      {
        name: 'ms_teams_get_channel_message',
        description: 'Get details for a specific Teams channel message',
      },
      {
        name: 'ms_teams_send_channel_message',
        description: 'Send a message to a Teams channel',
      },
      {
        name: 'ms_teams_list_message_replies',
        description: 'Read replies for a Teams channel message',
      },
      {
        name: 'ms_teams_reply_to_message',
        description: 'Reply to a Teams channel message',
      },
      {
        name: 'ms_teams_list_members',
        description: 'List members of a Microsoft Team',
      },
      {
        name: 'ms_teams_list_chats',
        description: 'List available Microsoft Teams chats',
      },
    ],
    setupNotes: [
      'Teams uses the existing Outlook/Microsoft Graph OAuth connection rather than a separate backend flow.',
      'If you connected Microsoft Graph before Teams support was added, reconnect to approve the Teams scopes.',
      'Assistant use can still be disabled from tool preferences with the Microsoft Teams toggle.',
    ],
  },
  {
    id: 'x',
    name: 'X',
    category: 'Social',
    description: 'Allow the assistant to retrieve X profile and post context, search public posts, and publish from the connected account.',
    preferenceKeys: ['x_api'],
    capabilities: [
      'Look up X user profiles by username or ID',
      'Fetch recent posts from public accounts',
      'Search posts by query and language',
      'Post new tweets from the connected account',
    ],
    tools: [
      {
        name: 'x_api_get_user_info',
        description: 'Get X user information by username or user ID',
      },
      {
        name: 'x_api_get_user_tweets',
        description: 'Get recent tweets from an X user',
      },
      {
        name: 'x_api_search_tweets',
        description: 'Search tweets using the X API',
      },
      {
        name: 'x_api_get_trending_topics',
        description: 'Get trending topics on X for a location',
      },
      {
        name: 'x_api_post_tweet',
        description: 'Post a new tweet using your connected account',
      },
    ],
    setupNotes: [
      'Connect X to authorize account access.',
      'Assistant use can still be disabled from tool preferences with the X toggle.',
    ],
  },
  {
    id: 'onedrive',
    name: 'OneDrive',
    category: 'Cloud storage',
    description: 'Connect OneDrive so the assistant can browse, inspect, read, organize, upload, and share files from your Microsoft cloud storage.',
    preferenceKeys: ['onedrive'],
    capabilities: [
      'Check OneDrive connection status before file workflows',
      'List, search, inspect, and read OneDrive files and folders',
      'Create folders, upload text files, update files, rename or move items, and delete items when requested',
      'Create share links, invite collaborators, and inspect sharing permissions',
    ],
    tools: [
      {
        name: 'onedrive_status',
        description: 'Check OneDrive connection and account status',
      },
      {
        name: 'onedrive_list_root',
        description: 'List files and folders at the OneDrive root',
      },
      {
        name: 'onedrive_list_folder',
        description: 'List files and folders inside a OneDrive folder',
      },
      {
        name: 'onedrive_search',
        description: 'Search OneDrive files by query',
      },
      {
        name: 'onedrive_get_item',
        description: 'Get metadata for a OneDrive file or folder',
      },
      {
        name: 'onedrive_download_file',
        description: 'Read or download supported OneDrive file content',
      },
      {
        name: 'onedrive_upload_text_file',
        description: 'Upload a text, JSON, or markdown file to OneDrive',
      },
      {
        name: 'onedrive_update_text_file',
        description: 'Overwrite a supported text-like OneDrive file',
      },
      {
        name: 'onedrive_create_folder',
        description: 'Create a folder in OneDrive',
      },
      {
        name: 'onedrive_rename_move',
        description: 'Rename or move a OneDrive item',
      },
      {
        name: 'onedrive_delete_item',
        description: 'Delete a OneDrive item when requested',
      },
      {
        name: 'onedrive_create_share_link',
        description: 'Create a view or edit sharing link',
      },
      {
        name: 'onedrive_invite',
        description: 'Invite people to a OneDrive item',
      },
      {
        name: 'onedrive_get_permissions',
        description: 'Inspect sharing permissions for a OneDrive item',
      },
    ],
    setupNotes: [
      'Connect OneDrive to authorize storage access.',
      'Assistant use can still be disabled from tool preferences with the OneDrive toggle.',
    ],
  },
  {
    id: 'dropbox',
    name: 'Dropbox',
    category: 'Cloud storage',
    description: 'Connect Dropbox so Banbury can work with Dropbox-backed storage features for your account.',
    preferenceKeys: [],
    capabilities: [
      'Authorize Dropbox account access',
      'Support Dropbox-backed file and storage workflows',
      'Keep storage access scoped to the connected Dropbox account',
    ],
    tools: [],
    setupNotes: [
      'Connect Dropbox to authorize storage access.',
      'No dedicated assistant tool toggle is currently exposed for Dropbox in the composer preferences.',
    ],
  },
  {
    id: 'notion',
    name: 'Notion',
    category: 'Knowledge base',
    description: 'Connect Notion so the assistant can search workspace content, read pages, query data sources, and create pages.',
    preferenceKeys: ['notion'],
    capabilities: [
      'Search connected Notion pages and data sources',
      'Read page metadata and block content',
      'Query data sources with filters and sorts',
      'Create pages directly or from data source templates',
    ],
    tools: [
      {
        name: 'notion_search',
        description: 'Search connected Notion pages and data sources',
      },
      {
        name: 'notion_get_page',
        description: 'Get metadata and properties for a connected Notion page',
      },
      {
        name: 'notion_get_page_blocks',
        description: 'Read block children for a connected Notion page',
      },
      {
        name: 'notion_query_data_source',
        description: 'Query pages from a connected Notion data source',
      },
      {
        name: 'notion_list_templates',
        description: 'List templates for a connected Notion data source',
      },
      {
        name: 'notion_create_page',
        description: 'Create a Notion page under a parent page or data source',
      },
      {
        name: 'notion_create_page_from_template',
        description: 'Create a Notion page from a data source template',
      },
    ],
    setupNotes: [
      'Connect Notion to authorize workspace access.',
      'Assistant use can still be disabled from tool preferences with the Notion toggle.',
    ],
  },
]

export function getConnectionDetail(connectionId: string) {
  return connectionDetails.find((connection) => connection.id === connectionId) || connectionDetails[0]
}
