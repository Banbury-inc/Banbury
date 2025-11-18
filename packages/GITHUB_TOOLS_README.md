# GitHub Tools for AI Assistant

This document describes the GitHub integration tools available for the AI assistant.

## Overview

The GitHub tools enable the AI assistant to interact with GitHub repositories, issues, pull requests, and code search. These tools respect user preferences and require GitHub OAuth connection.

## Location

**Tools File:** `pages/api/assistant/langgraph-stream/agent/tools/githubTools.ts`

**Registered In:** `pages/api/assistant/langgraph-stream/agent/agent.ts`

## Available Tools

### 1. `github_list_repos`
List GitHub repositories for the authenticated user.

**Parameters:**
- `visibility` (optional): 'all', 'public', or 'private' (default: 'all')
- `sort` (optional): 'created', 'updated', 'pushed', or 'full_name' (default: 'updated')
- `perPage` (optional): Results per page (default: 30, max: 100)
- `page` (optional): Page number for pagination (default: 1)

**Returns:** Array of repositories with name, description, language, stars, and metadata

**Example Usage:**
```
"List my GitHub repositories sorted by most recently updated"
"Show me my private repositories"
```

### 2. `github_get_repo`
Get detailed information about a specific repository.

**Parameters:**
- `owner` (required): Repository owner (username or organization)
- `repo` (required): Repository name

**Returns:** Detailed repository information including description, languages, stars, forks, etc.

**Example Usage:**
```
"Get details about facebook/react repository"
"Show me information about my banbury-cloud-backend repo"
```

### 3. `github_list_issues`
List issues for a GitHub repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `state` (optional): 'open', 'closed', or 'all' (default: 'open')
- `perPage` (optional): Results per page (default: 30, max: 100)
- `page` (optional): Page number for pagination (default: 1)

**Returns:** Array of issues with title, number, state, labels, and assignees

**Example Usage:**
```
"Show me open issues in facebook/react"
"List all closed issues in my project"
```

### 4. `github_create_issue`
Create a new issue in a repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `title` (required): Issue title
- `body` (optional): Issue description (supports Markdown)
- `labels` (optional): Array of label names
- `assignees` (optional): Array of GitHub usernames

**Returns:** Created issue with number and URL

**Example Usage:**
```
"Create an issue in my project titled 'Fix login bug' with description 'Users cannot login with email'"
"File a bug report in my repo with labels 'bug' and 'high-priority'"
```

### 5. `github_list_pull_requests`
List pull requests for a repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `state` (optional): 'open', 'closed', or 'all' (default: 'open')
- `perPage` (optional): Results per page (default: 30, max: 100)
- `page` (optional): Page number for pagination (default: 1)

**Returns:** Array of PRs with title, number, state, branch info, and author

**Example Usage:**
```
"Show me open pull requests in facebook/react"
"List all PRs in my repository"
```

### 6. `github_get_file_contents`
Get the contents of a file from a repository.

**Parameters:**
- `owner` (required): Repository owner
- `repo` (required): Repository name
- `path` (required): Path to file (e.g., 'src/index.js')
- `ref` (optional): Branch, tag, or commit SHA (default: 'main')

**Returns:** File content (decoded from base64), name, size, and SHA

**Example Usage:**
```
"Show me the contents of README.md in facebook/react"
"Get the code from src/index.js in my repository"
```

### 7. `github_search_code`
Search for code across GitHub repositories.

**Parameters:**
- `query` (required): Search query using GitHub code search syntax
- `perPage` (optional): Results per page (default: 30, max: 100)
- `page` (optional): Page number for pagination (default: 1)

**Returns:** Array of code search results with file paths and snippets

**Example Usage:**
```
"Search for 'addClass' in octocat's repositories"
"Find TODO comments in my repositories"
"Search for 'user:myusername language:python import flask'"
```

## GitHub Search Syntax

The `github_search_code` tool supports advanced GitHub search syntax:

- `user:username` - Search in a specific user's repositories
- `repo:owner/name` - Search in a specific repository
- `language:python` - Filter by programming language
- `path:src/` - Search in a specific directory
- `extension:js` - Filter by file extension
- `filename:README.md` - Search by filename

**Examples:**
- `addClass user:octocat` - Find "addClass" in octocat's repos
- `repo:facebook/react useState` - Find "useState" in React repo
- `language:python import flask` - Find Flask imports in Python files

## Tool Preferences

All GitHub tools respect the `github` preference in user settings:

- If `github` is set to `false`, tools will return: "GitHub access is disabled by user preference"
- Users can enable/disable GitHub tools in Settings → Connections → GitHub Integration

## Backend Endpoints

The tools proxy to these backend endpoints:

- `GET /authentication/github/repos/` - List repositories
- `GET /authentication/github/repos/{owner}/{repo}/` - Get repository
- `GET /authentication/github/repos/{owner}/{repo}/issues/` - List issues
- `POST /authentication/github/issues/create/` - Create issue
- `GET /authentication/github/repos/{owner}/{repo}/pulls/` - List pull requests
- `GET /authentication/github/repos/{owner}/{repo}/contents/` - Get file contents
- `GET /authentication/github/search/code/` - Search code

## Setup Requirements

1. **GitHub OAuth App** must be configured in backend with:
   - `GH_CLIENT_ID` environment variable
   - `GH_CLIENT_SECRET` environment variable

2. **User must connect** their GitHub account via Settings → Connections

3. **Required OAuth scopes:**
   - `repo` - Full control of repositories
   - `read:org` - Read organization data
   - `user:email` - Access user email
   - `gist` - Create gists
   - `notifications` - Access notifications

## Error Handling

Tools return JSON with `success: false` and `error` message when:

- GitHub is not connected
- GitHub access is disabled by user preference
- API request fails (network error, invalid credentials)
- Repository or resource not found
- Rate limit exceeded

## Rate Limits

GitHub API has these rate limits:
- **Authenticated requests:** 5,000 per hour
- **Search API:** 30 requests per minute
- **GraphQL API:** 5,000 points per hour

The AI assistant will handle rate limit errors gracefully.

## Example AI Conversations

**User:** "Show me my GitHub repositories"
**AI:** Uses `github_list_repos` → Returns list of repositories

**User:** "Create an issue in my banbury-cloud-backend repo to add API documentation"
**AI:** Uses `github_create_issue` → Creates issue and returns issue number

**User:** "What are the open pull requests in facebook/react?"
**AI:** Uses `github_list_pull_requests` → Returns list of open PRs

**User:** "Search for authentication code in my repositories"
**AI:** Uses `github_search_code` with query "user:myusername authentication" → Returns code results

## Integration with Other Tools

GitHub tools work seamlessly with other assistant features:

- **Memory Tools:** AI can remember repository names and preferences
- **File Tools:** Can download files from GitHub to user's cloud storage
- **Calendar Tools:** Can create calendar reminders for PR reviews
- **Slack Tools:** Can notify Slack channels about new issues

## Future Enhancements

Potential additions:
- Create pull requests
- Comment on issues/PRs
- Manage labels and milestones
- Branch operations
- Commit operations
- GitHub Actions integration
- GitHub Projects integration
- Webhook support
- GraphQL API support for complex queries

## Troubleshooting

**Tools return "GitHub access is disabled"**
- Enable GitHub in Settings → Connections

**Tools return "Missing auth token"**
- User must be authenticated with valid JWT token

**API returns 401 Unauthorized**
- User needs to reconnect GitHub account
- Check if GitHub OAuth credentials are configured

**API returns 404 Not Found**
- Verify repository owner/name spelling
- Check if user has access to the repository

**Search returns no results**
- Verify search query syntax
- Check if repositories are public/accessible
- Try simpler search terms

## Documentation Links

- [GitHub REST API Documentation](https://docs.github.com/en/rest)
- [GitHub Code Search Syntax](https://docs.github.com/en/search-github/searching-on-github/searching-code)
- [GitHub OAuth Documentation](https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps)
- [Backend Setup Guide](../../banbury-cloud-backend/GITHUB_INTEGRATION_SETUP.md)

