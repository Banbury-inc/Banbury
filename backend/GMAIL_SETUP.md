# Gmail Integration Setup Guide

This guide explains how to set up Gmail integration for the Banbury website AI assistant.

## Prerequisites

1. A Google Cloud Project
2. Gmail API enabled
3. A Google Service Account

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Gmail API for your project

### 2. Create a Service Account

1. In the Google Cloud Console, go to "IAM & Admin" > "Service Accounts"
2. Click "Create Service Account"
3. Give it a name (e.g., "banbury-gmail-service")
4. Add a description (optional)
5. Click "Create and Continue"

### 3. Create and Download Service Account Key

1. Click on the service account you just created
2. Go to the "Keys" tab
3. Click "Add Key" > "Create new key"
4. Choose "JSON" format
5. Download the JSON file

### 4. Enable Gmail API Domain-Wide Delegation

1. In the service account details, note the "Client ID"
2. Go to your Google Workspace Admin Console
3. Navigate to "Security" > "API Controls" > "Domain-wide Delegation"
4. Click "Add new"
5. Enter the Client ID from step 1
6. Add the following OAuth scopes:
   ```
   https://www.googleapis.com/auth/gmail.readonly
   https://www.googleapis.com/auth/gmail.send
   https://www.googleapis.com/auth/gmail.settings.basic
   ```
7. Click "Authorize"

### 5. Configure Environment Variables

Add the following environment variables to your `.env.local` file:

```env
# Gmail Service Account Configuration
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- The `GOOGLE_PRIVATE_KEY` should be the entire private key from the JSON file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` parts
- Make sure to include the `\n` characters in the private key string
- The private key should be properly escaped if you're using it in a shell environment

### 6. Install Dependencies

Run the following command to install the required dependencies:

```bash
npm install
```

## Available Gmail Tools

The AI assistant now has access to the following Gmail tools:

### 1. `gmail_search`
Search for emails using Gmail search syntax
- **Parameters:**
  - `query`: Gmail search query (e.g., "from:john@example.com", "subject:meeting", "is:unread")
  - `maxResults`: Maximum number of results (optional, default: 10)

### 2. `gmail_get_recent`
Get the most recent emails from the inbox
- **Parameters:**
  - `maxResults`: Maximum number of results (optional, default: 10)

### 3. `gmail_get_unread`
Get unread emails from the inbox
- **Parameters:**
  - `maxResults`: Maximum number of results (optional, default: 10)

### 4. `gmail_get_email`
Get a specific email by its message ID
- **Parameters:**
  - `messageId`: The Gmail message ID

### 5. `gmail_send_email`
Send an email through Gmail
- **Parameters:**
  - `to`: Recipient email address
  - `subject`: Email subject
  - `body`: Email body content
  - `from`: Sender email address (optional, uses default if not provided)

### 6. `gmail_get_from_sender`
Get emails from a specific sender
- **Parameters:**
  - `sender`: Email address of the sender
  - `maxResults`: Maximum number of results (optional, default: 10)

### 7. `gmail_get_signature`
Get the user's Gmail signature that is automatically added to outgoing emails
- **Parameters:** None

### 8. `gmail_send_email_with_signature`
Send an email through Gmail with the user's signature automatically added
- **Parameters:**
  - `to`: Recipient email address
  - `subject`: Email subject
  - `body`: Email body content
  - `from`: Sender email address (optional, uses default if not provided)

## Example Usage

The AI assistant can now handle requests like:

- "Show me my recent emails"
- "Search for emails from john@example.com"
- "Get my unread emails"
- "Send an email to jane@example.com with subject 'Meeting tomorrow' and body 'Let's meet at 2 PM'"
- "Find emails about project updates"
- "Get my email signature"
- "Send an email with my signature automatically added"

## Troubleshooting

### Common Issues

1. **Authentication Error**: Make sure your service account has the correct permissions and the private key is properly formatted
2. **API Not Enabled**: Ensure the Gmail API is enabled in your Google Cloud Project
3. **Domain-Wide Delegation**: Verify that domain-wide delegation is properly configured in Google Workspace Admin Console
4. **Environment Variables**: Check that all environment variables are correctly set and accessible

### Testing the Integration

You can test the Gmail integration by asking the AI assistant to:
- "Show me my 5 most recent emails"
- "Search for emails with 'important' in the subject"

## Security Considerations

- Keep your service account private key secure and never commit it to version control
- Use environment variables for sensitive configuration
- Regularly rotate your service account keys
- Monitor API usage to ensure it stays within quotas
- Consider implementing rate limiting for Gmail operations
