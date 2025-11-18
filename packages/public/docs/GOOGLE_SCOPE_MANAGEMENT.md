# Google OAuth Scope Management

## Overview

The Banbury website now implements a granular Google OAuth scope management system that allows users to grant access to specific Google services on-demand, rather than requesting all permissions upfront.

## How It Works

### Initial Authentication
When users first authenticate with Google, only minimal scopes are requested:
- `https://www.googleapis.com/auth/userinfo.profile`
- `https://www.googleapis.com/auth/userinfo.email`
- `openid`

These scopes provide basic account information needed for user identification.

### Incremental Authorization
Users can then activate additional Google services as needed:
- **Google Drive**: File management and storage
- **Gmail**: Email reading, sending, and management
- **Google Calendar**: Calendar event management

## Backend Implementation

### New Endpoints

#### `GET /authentication/scopes/user/`
Returns the current scopes for the authenticated user and which features are available.

**Response:**
```json
{
  "scopes": ["https://www.googleapis.com/auth/userinfo.profile", ...],
  "available_features": {
    "profile": true,
    "drive": false,
    "gmail": false,
    "calendar": false
  },
  "message": "Scopes retrieved successfully"
}
```

#### `GET /authentication/scopes/features/`
Returns information about available Google features and their required scopes.

**Response:**
```json
{
  "features": {
    "profile": {
      "name": "Profile Information",
      "description": "Access to your Google profile information",
      "scopes": ["https://www.googleapis.com/auth/userinfo.profile", ...],
      "required": true
    },
    "gmail": {
      "name": "Gmail",
      "description": "Access to read, send, and manage your Gmail messages",
      "scopes": ["https://www.googleapis.com/auth/gmail.modify", ...],
      "required": false
    }
  }
}
```

#### `POST /authentication/scopes/request/`
Requests additional scopes for specific features.

**Request:**
```json
{
  "features": ["gmail", "drive"]
}
```

**Response:**
```json
{
  "authUrl": "https://accounts.google.com/oauth2/auth?...",
  "requested_features": ["gmail", "drive"],
  "new_scopes": ["https://www.googleapis.com/auth/gmail.modify", ...],
  "message": "Additional scopes authorization URL generated"
}
```

### Scope Definitions

```python
ALL_SCOPES = {
    "profile": [
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ],
    "drive": [
        "https://www.googleapis.com/auth/drive",
        "https://www.googleapis.com/auth/drive.file"
    ],
    "gmail": [
        "https://www.googleapis.com/auth/gmail.modify",
        "https://www.googleapis.com/auth/gmail.settings.basic"
    ],
    "calendar": [
        "https://www.googleapis.com/auth/calendar"
    ]
}
```

## Frontend Implementation

### ScopeService

The `ScopeService` class provides methods for managing Google scopes:

```typescript
// Get current user scopes
const userScopes = await ScopeService.getUserScopes()

// Check if a feature is available
const hasGmail = await ScopeService.isFeatureAvailable('gmail')

// Request additional scopes
await ScopeService.requestFeatureAccess(['gmail', 'drive'])

// Get missing features
const missingFeatures = await ScopeService.getMissingFeatures()
```

### ScopeManager Component

The `ScopeManager` component provides a UI for users to:
- View current Google integration status
- See which features are available/active
- Activate additional features
- Understand what each feature provides access to

### Integration with EmailTab

The `EmailTab` component now checks for Gmail access and shows a prompt to activate it if not available:

```typescript
const checkGmailAccess = useCallback(async () => {
  const isAvailable = await ScopeService.isFeatureAvailable('gmail')
  setGmailAvailable(isAvailable)
}, [])
```

## User Experience

### First-Time Users
1. User clicks "Sign in with Google"
2. Google OAuth requests minimal permissions (profile only)
3. User is redirected to dashboard
4. When user tries to access email/files/calendar, they see an activation prompt
5. User clicks "Activate" and is redirected to Google OAuth for additional permissions
6. User returns to the app with new permissions active

### Returning Users
1. User signs in with existing Google account
2. System checks which scopes are already granted
3. Features are automatically available based on existing permissions
4. User can activate additional features from Settings page

### Settings Page
The Settings page (`/settings`) provides:
- Overview of current Google integration status
- Ability to activate additional features
- Quick access to different app sections
- Account information display

## Security Benefits

1. **Minimal Initial Permissions**: Users only grant the permissions they actually need
2. **Transparent Permission Requests**: Users understand exactly what each feature requires
3. **Incremental Authorization**: Users can add permissions as they discover new features
4. **Clear Permission Management**: Users can see and manage their granted permissions

## Technical Benefits

1. **Better User Trust**: Users are more likely to trust an app that requests minimal permissions
2. **Reduced OAuth Friction**: Initial sign-up is faster with fewer permission requests
3. **Feature Discovery**: Users can discover and activate features as they use the app
4. **Compliance**: Easier to comply with privacy regulations and app store policies

## Migration from Legacy System

The system maintains backward compatibility:
- Existing users with full scopes continue to work normally
- New users get the minimal scope experience
- Legacy scopes are still supported for existing integrations

## Future Enhancements

1. **Permission Revocation**: Allow users to revoke specific permissions
2. **Permission Analytics**: Track which permissions are most commonly requested
3. **Conditional Features**: Show/hide features based on available permissions
4. **Bulk Activation**: Allow users to activate multiple features at once
5. **Permission Explanations**: More detailed explanations of what each permission allows

## Troubleshooting

### Common Issues

1. **Scope Not Granted**: User needs to re-authenticate with Google
2. **Feature Not Available**: Check if the required scopes are granted
3. **OAuth Errors**: Verify redirect URIs and client configuration

### Debug Steps

1. Check user scopes: `GET /authentication/scopes/user/`
2. Verify feature availability: `ScopeService.isFeatureAvailable('feature')`
3. Check Google OAuth configuration in backend
4. Review browser console for OAuth errors

## API Reference

### Backend Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/authentication/scopes/user/` | GET | Get current user scopes |
| `/authentication/scopes/features/` | GET | Get available features |
| `/authentication/scopes/request/` | POST | Request additional scopes |

### Frontend Services

| Service | Method | Description |
|---------|--------|-------------|
| `ScopeService` | `getUserScopes()` | Get current scopes |
| `ScopeService` | `isFeatureAvailable()` | Check feature availability |
| `ScopeService` | `requestFeatureAccess()` | Request new permissions |
| `ScopeService` | `getMissingFeatures()` | Get unavailable features |

### Components

| Component | Purpose |
|-----------|---------|
| `ScopeManager` | UI for managing Google integration |
| `EmailTab` | Email interface with scope checking |
| `Settings` | Settings page with scope management |
