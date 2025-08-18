# Gmail Signature Integration Feature

## Overview

This feature adds the ability to automatically retrieve and use Gmail signatures when composing emails. The implementation includes both backend API endpoints and frontend UI enhancements to provide a seamless email composition experience.

## Features

### Backend Features

1. **Signature Retrieval API**
   - Endpoint: `GET /api/gmail/signature`
   - Retrieves the user's Gmail signature from their account settings
   - Returns signature content or error message

2. **Signature-Aware Email Sending**
   - Endpoint: `POST /api/gmail/send-with-signature`
   - Automatically appends the user's signature to outgoing emails
   - Maintains all existing email functionality

3. **Gmail API Integration**
   - Added `gmail.settings.basic` scope for signature access
   - New methods in `GmailService` class:
     - `getEmailSignature()`: Retrieves signature from Gmail settings
     - `sendEmailWithSignature()`: Sends emails with automatic signature inclusion

4. **AI Assistant Tools**
   - `gmail_get_signature`: Tool for AI to retrieve user's signature
   - `gmail_send_email_with_signature`: Tool for AI to send emails with signature

### Frontend Features

1. **Automatic Signature Loading**
   - Fetches signature when composing new emails (not replies)
   - Automatically populates empty message body with signature
   - Graceful fallback if signature cannot be retrieved

2. **Manual Signature Insertion**
   - "Insert Signature" button in email composer
   - Allows users to manually add signature at any point
   - Preserves existing message content

3. **Visual Feedback**
   - Loading indicator during signature fetch
   - Updated placeholder text during loading
   - Success/error notifications

4. **Enhanced Email Service**
   - New methods in `EmailService`:
     - `getSignature()`: Retrieves signature from backend
     - `sendMessageWithSignature()`: Sends emails with signature

## Technical Implementation

### Backend Architecture

```typescript
// GmailService class additions
class GmailService {
  async getEmailSignature(): Promise<{ success: boolean; signature?: string; error?: string }>
  async sendEmailWithSignature(request: SendEmailRequest): Promise<{ success: boolean; messageId?: string }>
}

// API Routes
GET /api/gmail/signature
POST /api/gmail/send-with-signature
```

### Frontend Architecture

```typescript
// EmailComposer component enhancements
interface EmailComposerProps {
  // ... existing props
}

// State additions
const [signature, setSignature] = useState<string>('')
const [loadingSignature, setLoadingSignature] = useState(false)

// New functionality
useEffect(() => {
  if (!replyTo) {
    fetchSignature()
  }
}, [replyTo])
```

### Gmail API Scopes

The following scopes are required for signature functionality:

```javascript
scopes: [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/gmail.settings.basic'  // NEW
]
```

## Usage Examples

### AI Assistant Commands

1. **Get User's Signature**
   ```
   "Get my email signature"
   "Show me my Gmail signature"
   ```

2. **Send Email with Signature**
   ```
   "Send an email to john@example.com with subject 'Meeting' and body 'Let's meet tomorrow' with my signature"
   "Compose an email with my signature automatically added"
   ```

### Frontend Usage

1. **Automatic Signature Loading**
   - Open email composer for new email
   - Signature is automatically fetched and displayed
   - Empty message body is populated with signature

2. **Manual Signature Insertion**
   - Click "Insert Signature" button in composer
   - Signature is appended to existing message content
   - Can be used multiple times if needed

## Configuration

### Environment Variables

No additional environment variables are required beyond the existing Gmail setup:

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

### Google Workspace Setup

1. **Enable Gmail API** in Google Cloud Console
2. **Configure Domain-Wide Delegation** for service account
3. **Add Required Scopes** including `gmail.settings.basic`
4. **User Signature Setup** in Gmail settings (done by end user)

## Error Handling

### Backend Error Handling

- **Signature Not Found**: Returns empty signature string
- **API Permission Error**: Returns error message with details
- **Network Errors**: Graceful fallback with error logging

### Frontend Error Handling

- **Signature Fetch Failure**: Silent fallback, no user interruption
- **Send Failure**: User notification with retry option
- **Network Issues**: Graceful degradation of functionality

## Security Considerations

1. **Scope Minimization**: Only requests necessary `gmail.settings.basic` scope
2. **Service Account Security**: Uses existing secure authentication
3. **Data Privacy**: Signature data is not stored, only retrieved when needed
4. **User Control**: Users can manually control signature insertion

## Testing

### Backend Testing

```bash
# Test signature retrieval
curl -X GET http://localhost:3000/api/gmail/signature

# Test signature-aware email sending
curl -X POST http://localhost:3000/api/gmail/send-with-signature \
  -H "Content-Type: application/json" \
  -d '{"to":"test@example.com","subject":"Test","body":"Hello"}'
```

### Frontend Testing

1. **Open Email Composer**
2. **Verify signature loading** for new emails
3. **Test manual signature insertion**
4. **Verify signature inclusion** in sent emails

## Troubleshooting

### Common Issues

1. **Signature Not Loading**
   - Check Gmail API permissions
   - Verify service account configuration
   - Ensure user has signature set in Gmail

2. **Permission Errors**
   - Verify `gmail.settings.basic` scope is added
   - Check domain-wide delegation setup
   - Confirm service account has proper permissions

3. **Signature Not Appearing in Sent Emails**
   - Check if signature is being appended correctly
   - Verify email sending process
   - Review Gmail API response for errors

### Debug Steps

1. **Check Browser Console** for frontend errors
2. **Review Backend Logs** for API errors
3. **Test Gmail API Directly** using Google API Explorer
4. **Verify Environment Variables** are correctly set

## Future Enhancements

1. **Signature Templates**: Support for multiple signature templates
2. **Rich Text Signatures**: HTML signature support
3. **Signature Preview**: Preview signature before sending
4. **Signature Management**: UI for managing signatures
5. **Conditional Signatures**: Different signatures for different contexts

## Dependencies

- `googleapis`: Gmail API integration
- `@langchain/core`: AI assistant tool framework
- `axios`: Frontend HTTP requests
- `react`: Frontend UI components

## Files Modified/Created

### Backend Files
- `src/lib/gmail.ts` - Added signature methods
- `src/lib/gmail-tools.ts` - Added signature tools
- `src/app/api/assistant/route.ts` - Added signature tools to AI
- `src/app/api/gmail/signature/route.ts` - NEW: Signature API endpoint
- `src/app/api/gmail/send-with-signature/route.ts` - NEW: Signature-aware sending endpoint

### Frontend Files
- `src/components/EmailComposer.tsx` - Enhanced with signature functionality
- `src/services/emailService.ts` - Added signature service methods

### Documentation Files
- `GMAIL_INTEGRATION_SUMMARY.md` - Updated with signature features
- `GMAIL_SETUP.md` - Updated with new scope requirements
- `GMAIL_SIGNATURE_FEATURE.md` - NEW: This comprehensive guide
