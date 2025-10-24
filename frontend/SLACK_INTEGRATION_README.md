# Slack Integration Implementation Guide

This document outlines the Slack integration that has been added to the frontend and the corresponding backend endpoints that need to be implemented.

## Frontend Components Created

### 1. Slack Tools (`pages/api/assistant/langgraph-stream/agent/tools/slackTools.ts`)
A comprehensive set of Slack tools for the AI assistant:
- `slackListChannelsTool` - List all accessible Slack channels
- `slackSendMessageTool` - Send messages to channels (with threading support)
- `slackGetChannelHistoryTool` - Retrieve message history from channels
- `slackGetThreadRepliesTool` - Get replies in a specific thread
- `slackSearchMessagesTool` - Search messages across channels
- `slackGetUserInfoTool` - Get user information by ID
- `slackSetChannelTopicTool` - Update channel topics
- `slackAddReactionTool` - Add emoji reactions to messages

All tools respect user preferences via the `toolPreferences.slack` setting.

### 2. Slack Connection Handler (`src/components/handlers/slack-connection.ts`)
Handles the OAuth flow and connection status:
- `checkSlackConnectionStatus()` - Check if Slack is connected
- `initiateSlackOAuth()` - Start OAuth flow
- `disconnectSlackAccount()` - Disconnect Slack workspace

### 3. Slack Connection Component (`src/components/modals/settings-tabs/SlackConnection.tsx`)
UI component for managing Slack connection in settings:
- Shows connection status (connected/not connected)
- Displays team name and username when connected
- Connect/Disconnect buttons
- Loading states

### 4. Updated ConnectionsTab (`src/components/modals/settings-tabs/ConnectionsTab.tsx`)
Added Slack integration section alongside Google and X (Twitter) integrations.

### 5. Tool Preferences Updated
Slack has been added to tool preferences in:
- `src/assistant/ClaudeRuntimeProvider/handlers/getToolPreferences.ts`
- `src/components/RightPanel/handlers/toggle-x-tool.ts`
- `src/components/modals/settings-tabs/AISettingsTab.tsx`
- `src/components/RightPanel/composer/thread/thread.tsx`

Default: `slack: false` (disabled by default for security)

### 6. Agent Configuration (`pages/api/assistant/langgraph-stream/agent/agent.ts`)
All Slack tools have been registered with the LangGraph agent.

## Backend Endpoints Required

You need to implement the following Django REST Framework endpoints:

### Authentication Endpoints

#### 1. Check Slack Connection Status
```
GET /authentication/slack/status/
Response: {
  "connected": boolean,
  "teamName": string (optional),
  "userName": string (optional)
}
```

#### 2. Initiate Slack OAuth
```
POST /authentication/slack/initiate_oauth/
Request: {
  "callback_url": string
}
Response: {
  "auth_url": string
}
```

#### 3. OAuth Callback Handler
```
GET /authentication/slack/oauth_callback/
Query params: code, state (from Slack OAuth)
Should: 
- Exchange code for access token
- Store token in user's profile
- Redirect to frontend settings page
```

#### 4. Disconnect Slack Account
```
POST /authentication/slack/disconnect/
Response: {
  "success": boolean,
  "message": string
}
```

### Slack API Proxy Endpoints

All endpoints below should:
- Require authentication (Bearer token)
- Check that user has connected Slack workspace
- Proxy requests to Slack API with stored access token
- Handle errors appropriately

#### 5. List Channels
```
GET /authentication/slack/channels/
Response: {
  "channels": [
    {
      "id": string,
      "name": string,
      "is_member": boolean,
      "num_members": number
    }
  ]
}
```

#### 6. Send Message
```
POST /authentication/slack/send_message/
Request: {
  "channel": string,
  "text": string,
  "thread_ts": string (optional)
}
Response: {
  "ts": string,
  "channel": string,
  "message": object
}
```

#### 7. Get Channel History
```
GET /authentication/slack/channel_history/
Query params: channel, limit, oldest (optional), latest (optional)
Response: {
  "messages": [
    {
      "user": string,
      "text": string,
      "ts": string,
      "thread_ts": string (optional)
    }
  ]
}
```

#### 8. Get Thread Replies
```
GET /authentication/slack/thread_replies/
Query params: channel, thread_ts, limit
Response: {
  "messages": [...]
}
```

#### 9. Search Messages
```
GET /authentication/slack/search/
Query params: query, count, sort
Response: {
  "messages": [...],
  "total": number
}
```

#### 10. Get User Info
```
GET /authentication/slack/user_info/
Query params: user_id
Response: {
  "user": {
    "id": string,
    "name": string,
    "real_name": string,
    "email": string (optional),
    "profile": object
  }
}
```

#### 11. Set Channel Topic
```
POST /authentication/slack/set_channel_topic/
Request: {
  "channel": string,
  "topic": string
}
Response: {
  "ok": boolean,
  "topic": string
}
```

#### 12. Add Reaction
```
POST /authentication/slack/add_reaction/
Request: {
  "channel": string,
  "timestamp": string,
  "name": string
}
Response: {
  "ok": boolean
}
```

## Slack App Setup

You'll need to create a Slack App in the Slack API Console with the following OAuth scopes:

### Bot Token Scopes (required):
- `channels:history` - View messages in public channels
- `channels:read` - View basic information about public channels
- `chat:write` - Send messages as the app
- `groups:history` - View messages in private channels (if needed)
- `groups:read` - View basic information about private channels
- `reactions:write` - Add emoji reactions
- `search:read` - Search workspace messages
- `users:read` - View users in the workspace

### User Token Scopes (if needed):
- May need additional user scopes depending on requirements

### Slack App Settings:
1. **OAuth & Permissions**: Add redirect URL matching your callback endpoint
2. **Event Subscriptions** (optional): For real-time updates
3. **Interactive Components** (optional): For button/modal interactions

## Database Schema Suggestion

Add to your User model or create a SlackConnection model:

```python
class SlackConnection(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='slack_connection')
    team_id = models.CharField(max_length=255)
    team_name = models.CharField(max_length=255)
    user_id = models.CharField(max_length=255)
    access_token = models.TextField()  # Encrypted
    bot_access_token = models.TextField(null=True, blank=True)  # Encrypted
    scope = models.TextField()
    connected_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'slack_connections'
```

## Security Considerations

1. **Token Storage**: Encrypt access tokens before storing in database
2. **Scope Validation**: Only request necessary OAuth scopes
3. **Rate Limiting**: Implement rate limiting on Slack API calls
4. **Error Handling**: Don't expose Slack API errors directly to frontend
5. **User Preferences**: Respect the `toolPreferences.slack` setting (already implemented in frontend)
6. **Token Refresh**: Handle token expiration gracefully

## Testing Checklist

- [ ] OAuth flow works correctly
- [ ] Connection status updates properly
- [ ] All API endpoints return expected data
- [ ] Error messages are user-friendly
- [ ] Disconnection cleans up stored tokens
- [ ] Tool preferences toggle works
- [ ] AI assistant can access Slack tools when enabled
- [ ] Rate limiting prevents abuse
- [ ] Tokens are encrypted at rest

## Example Implementation Pattern

Follow the existing pattern used for X API and Gmail integrations:
- See `authentication/views/x_api_views.py` or similar for reference
- Use the same authentication decorator pattern
- Follow the same error handling approach
- Maintain consistency with existing code style

## Next Steps

1. Create Slack App in Slack API Console
2. Implement authentication endpoints
3. Implement Slack API proxy endpoints
4. Test OAuth flow end-to-end
5. Test each tool with the AI assistant
6. Add monitoring and logging
7. Document any rate limits or quotas

