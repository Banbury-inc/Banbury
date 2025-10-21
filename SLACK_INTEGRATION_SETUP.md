# Slack Integration Setup for Banbury

This document provides comprehensive instructions for setting up Slack integration with Banbury workspaces, enabling AI agent interaction through Slack similar to Cursor and Devin AI.

## Overview

The Slack integration allows users to:
- Connect their Slack workspace to Banbury
- Interact with an AI agent via Slack messages
- Mention @banbury in channels or send direct messages
- Receive AI-powered responses and assistance

## Frontend Implementation ✅

The frontend UI has been implemented with:

1. **SlackConnection Component** (`/frontend/src/components/modals/settings-tabs/SlackConnection.tsx`)
   - OAuth connection flow
   - Connection status display
   - Workspace information
   - Test connection functionality
   - Disconnect option

2. **Slack API Handlers** (`/frontend/src/components/handlers/slack-api-connection.ts`)
   - `checkSlackConnectionStatus()` - Check if workspace is connected
   - `initiateSlackOAuth()` - Start OAuth flow
   - `disconnectSlackWorkspace()` - Remove workspace connection
   - `getSlackChannels()` - List available channels
   - `testSlackConnection()` - Test the connection

3. **UI Integration**
   - Added to Settings page connections tab
   - Added to Settings modal connections tab
   - OAuth callback handling for success/failure

## Backend Implementation Requirements

### 1. Slack App Configuration

Create a new Slack app at https://api.slack.com/apps:

```yaml
App Name: Banbury AI Assistant
Description: AI-powered assistant for Banbury workspaces

OAuth & Permissions:
  Bot Token Scopes:
    - app_mentions:read      # Read messages that mention the bot
    - channels:history       # View messages in public channels
    - channels:read         # View basic channel info
    - chat:write           # Send messages
    - groups:history       # View messages in private channels
    - groups:read          # View basic private channel info
    - im:history           # View direct messages
    - im:read              # View basic DM info
    - im:write             # Send direct messages
    - users:read           # View user info
    - users:read.email     # View user email addresses

  User Token Scopes (optional):
    - channels:read
    - groups:read
    - im:read
    - users:read

Event Subscriptions:
  Request URL: https://api.dev.banbury.io/slack/events/
  Subscribe to Bot Events:
    - app_mention          # When someone mentions @banbury
    - message.channels     # Messages in public channels
    - message.groups       # Messages in private channels
    - message.im          # Direct messages
    - member_joined_channel # When bot joins a channel

Interactivity & Shortcuts:
  Request URL: https://api.dev.banbury.io/slack/interactive/
  
Slash Commands (optional):
  /banbury - Interact with Banbury AI
  Request URL: https://api.dev.banbury.io/slack/commands/
```

### 2. Environment Variables

Add to backend `.env`:

```bash
SLACK_CLIENT_ID=your_slack_client_id
SLACK_CLIENT_SECRET=your_slack_client_secret
SLACK_SIGNING_SECRET=your_slack_signing_secret
SLACK_REDIRECT_URI=https://api.dev.banbury.io/slack/oauth/callback/
```

### 3. Database Schema

```sql
-- Slack workspace connections
CREATE TABLE slack_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    team_id VARCHAR(255) NOT NULL,
    team_name VARCHAR(255),
    bot_user_id VARCHAR(255) NOT NULL,
    bot_access_token TEXT NOT NULL,
    user_access_token TEXT,
    scope TEXT,
    authed_user JSONB,
    incoming_webhook JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, team_id)
);

-- Slack conversation threads
CREATE TABLE slack_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slack_connection_id UUID REFERENCES slack_connections(id) ON DELETE CASCADE,
    channel_id VARCHAR(255) NOT NULL,
    thread_ts VARCHAR(255),
    user_id VARCHAR(255) NOT NULL,
    conversation_history JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_channel_thread (channel_id, thread_ts)
);
```

### 4. API Endpoints

```python
# Django/Flask example endpoints

# OAuth endpoints
POST   /slack/initiate-oauth/      # Start OAuth flow
GET    /slack/oauth/callback/      # OAuth callback handler

# Connection management
GET    /slack/connection-status/   # Check connection status
POST   /slack/disconnect/          # Disconnect workspace
POST   /slack/test-connection/     # Test the connection
GET    /slack/channels/            # List channels

# Event handling
POST   /slack/events/             # Slack Events API webhook
POST   /slack/interactive/       # Interactive components
POST   /slack/commands/           # Slash commands
```

### 5. OAuth Flow Implementation

```python
from slack_sdk import WebClient
from slack_sdk.oauth import AuthorizeUrlGenerator, RedirectUriPageRenderer
from slack_sdk.oauth.state_store import FileOAuthStateStore
import os

class SlackOAuthHandler:
    def __init__(self):
        self.client_id = os.environ["SLACK_CLIENT_ID"]
        self.client_secret = os.environ["SLACK_CLIENT_SECRET"]
        self.redirect_uri = os.environ["SLACK_REDIRECT_URI"]
        self.scopes = ["app_mentions:read", "channels:history", "chat:write", ...]
        
    def initiate_oauth(self, user_id):
        state_store = FileOAuthStateStore(expiration_seconds=600)
        state = state_store.issue()
        
        authorize_url_generator = AuthorizeUrlGenerator(
            client_id=self.client_id,
            scopes=self.scopes,
            redirect_uri=self.redirect_uri,
        )
        
        auth_url = authorize_url_generator.generate(state)
        
        # Store state with user_id for callback
        cache.set(f"slack_oauth_state:{state}", user_id, timeout=600)
        
        return {"auth_url": auth_url}
    
    def handle_callback(self, code, state):
        # Verify state and get user_id
        user_id = cache.get(f"slack_oauth_state:{state}")
        if not user_id:
            raise ValueError("Invalid OAuth state")
        
        # Exchange code for token
        client = WebClient()
        response = client.oauth_v2_access(
            client_id=self.client_id,
            client_secret=self.client_secret,
            code=code,
            redirect_uri=self.redirect_uri
        )
        
        # Save connection to database
        slack_connection = SlackConnection.objects.create(
            user_id=user_id,
            team_id=response["team"]["id"],
            team_name=response["team"]["name"],
            bot_user_id=response["bot_user_id"],
            bot_access_token=response["access_token"],
            scope=response["scope"],
            authed_user=response.get("authed_user", {})
        )
        
        # Redirect to frontend with success
        return redirect(f"{FRONTEND_URL}/settings?slack_connected=true")
```

### 6. Event Handling & AI Integration

```python
from slack_sdk import WebClient
from slack_sdk.signature import SignatureVerifier
import json

class SlackEventHandler:
    def __init__(self):
        self.signature_verifier = SignatureVerifier(
            signing_secret=os.environ["SLACK_SIGNING_SECRET"]
        )
        
    def verify_request(self, request):
        return self.signature_verifier.is_valid_request(
            request.body,
            request.headers
        )
    
    async def handle_event(self, request):
        if not self.verify_request(request):
            return {"error": "Invalid request signature"}, 401
        
        body = json.loads(request.body)
        
        # Handle URL verification challenge
        if body.get("type") == "url_verification":
            return {"challenge": body["challenge"]}
        
        # Handle events
        event = body.get("event", {})
        event_type = event.get("type")
        
        if event_type == "app_mention":
            await self.handle_mention(event)
        elif event_type == "message":
            await self.handle_message(event)
            
        return {"ok": True}
    
    async def handle_mention(self, event):
        """Handle @banbury mentions"""
        team_id = event["team"]
        channel_id = event["channel"]
        user_id = event["user"]
        text = event["text"]
        thread_ts = event.get("thread_ts", event["ts"])
        
        # Get Slack connection
        connection = SlackConnection.objects.get(team_id=team_id)
        client = WebClient(token=connection.bot_access_token)
        
        # Remove bot mention from text
        cleaned_text = text.replace(f"<@{connection.bot_user_id}>", "").strip()
        
        # Get AI response
        ai_response = await self.get_ai_response(
            user_query=cleaned_text,
            connection=connection,
            channel_id=channel_id,
            user_id=user_id
        )
        
        # Send response to Slack
        client.chat_postMessage(
            channel=channel_id,
            text=ai_response,
            thread_ts=thread_ts
        )
    
    async def get_ai_response(self, user_query, connection, channel_id, user_id):
        """Integrate with your AI agent"""
        # Get or create conversation context
        conversation = SlackConversation.objects.get_or_create(
            slack_connection=connection,
            channel_id=channel_id,
            user_id=user_id
        )
        
        # Get conversation history
        history = conversation.conversation_history or []
        
        # Call your AI service (similar to how you handle chat in the app)
        # This should integrate with your existing LangGraph/AI infrastructure
        ai_service = YourAIService()
        response = await ai_service.get_response(
            query=user_query,
            context=history,
            user_id=connection.user_id
        )
        
        # Update conversation history
        history.append({"role": "user", "content": user_query})
        history.append({"role": "assistant", "content": response})
        conversation.conversation_history = history
        conversation.save()
        
        return response
```

### 7. Security Considerations

1. **Request Verification**: Always verify Slack requests using signing secret
2. **Token Storage**: Encrypt bot tokens in database
3. **Scope Limitations**: Request only necessary OAuth scopes
4. **Rate Limiting**: Implement rate limiting for API endpoints
5. **Error Handling**: Don't expose internal errors to Slack

### 8. Testing

1. **Local Development**: Use ngrok for local webhook testing
   ```bash
   ngrok http 8080
   # Update Slack app URLs with ngrok URL
   ```

2. **Test Cases**:
   - OAuth flow completion
   - Mention handling in channels
   - Direct message conversations
   - Thread continuity
   - Multi-workspace support
   - Error scenarios

## Deployment Checklist

- [ ] Create Slack app and configure OAuth & permissions
- [ ] Set up environment variables on backend
- [ ] Create database tables for Slack connections
- [ ] Implement OAuth flow endpoints
- [ ] Implement event handling endpoints
- [ ] Connect to AI agent service
- [ ] Test with a development Slack workspace
- [ ] Update production URLs in Slack app config
- [ ] Deploy to production

## Future Enhancements

1. **Channel Selection**: Allow users to select specific channels for bot access
2. **Slash Commands**: Add custom commands like `/banbury help`
3. **Interactive Messages**: Add buttons and menus to responses
4. **File Handling**: Process files shared in Slack
5. **Notification Settings**: Configure when/how bot responds
6. **Multi-workspace**: Support multiple Slack workspaces per user
7. **Analytics**: Track usage and conversation metrics

## Support

For questions about implementation:
- Frontend: Check `/frontend/src/components/modals/settings-tabs/SlackConnection.tsx`
- Backend: Follow this guide and Slack API documentation
- Slack API Docs: https://api.slack.com/