# Dropbox Integration Contract

This document defines the Banbury cloud API contract required by the frontend Dropbox integration. The frontend only talks to authenticated Banbury endpoints. Dropbox access tokens, refresh tokens, client secrets, and OAuth state are stored and validated server-side.

## OAuth And Token Storage

Dropbox uses OAuth 2.0 authorization code flow with offline access:

- Authorization requests include `response_type=code`, `token_access_type=offline`, `state`, `redirect_uri`, and the configured Dropbox app key.
- The Banbury API exchanges the authorization code at Dropbox `/oauth2/token` using the Dropbox app secret.
- Refresh tokens are encrypted at rest and keyed to the authenticated Banbury user.
- Short-lived Dropbox access tokens are refreshed server-side before Dropbox API calls when needed.
- `POST /authentication/dropbox/disconnect/` revokes the current Dropbox token with Dropbox `auth/token/revoke` and deletes stored provider credentials.

Required scopes:

- `account_info.read`
- `files.metadata.read`
- `files.content.read`
- `files.content.write`
- `sharing.read`
- `sharing.write`

## Normalized Metadata

Dropbox metadata should be normalized before it reaches the frontend:

```ts
export interface DropboxFile {
  id: string
  name: string
  mimeType: string
  pathLower?: string
  pathDisplay?: string
  clientModified?: string
  serverModified?: string
  size?: number
  webUrl?: string
  folder?: { childCount?: number }
  file?: { mimeType?: string }
  isDeleted?: boolean
}
```

Use Dropbox `id` when available. Keep `path_lower` and `path_display` because Dropbox rename, move, and sharing flows often require paths.

## Endpoints

All endpoints require the Banbury bearer token.

- `GET /authentication/dropbox/status/` returns `{ connected, accountEmail, accountName }`.
- `POST /authentication/dropbox/initiate_oauth/` accepts `{ callback_url }` and returns `{ auth_url }`.
- `GET /authentication/dropbox/oauth_callback/` validates `state`, exchanges the code, stores encrypted tokens, and redirects back to the app.
- `POST /authentication/dropbox/disconnect/` revokes Dropbox access and clears stored provider credentials.
- `GET /authentication/dropbox/root/children/?limit=100&cursor=...` maps Dropbox `files/list_folder` and `files/list_folder/continue`.
- `GET /authentication/dropbox/items/{itemId}/children/?limit=100&cursor=...` lists child items for a normalized Dropbox folder id/path.
- `GET /authentication/dropbox/items/{itemId}/` returns normalized metadata.
- `GET /authentication/dropbox/items/{itemId}/download/` streams bytes from Dropbox `files/download`.
- `POST /authentication/dropbox/files/upload/` uploads multipart file content. The backend chooses direct upload or upload sessions.
- `POST /authentication/dropbox/items/{itemId}/update/` overwrites existing file content.
- `POST /authentication/dropbox/folders/create/` accepts `{ parent_id, name }`.
- `PATCH /authentication/dropbox/items/{itemId}/rename_move/` accepts `{ name?, parent_id? }`.
- `DELETE /authentication/dropbox/items/{itemId}/delete/` deletes the item.
- `GET /authentication/dropbox/search/?q=...&limit=50` maps Dropbox search.
- `GET /authentication/dropbox/recent/?limit=50` returns recently modified files from a backend index or traversal.
- `GET /authentication/dropbox/favorites/`, `POST /authentication/dropbox/favorites/{itemId}/`, and `POST /authentication/dropbox/favorites/{itemId}/remove/` are Banbury-managed favorites.
- `GET /authentication/dropbox/trash/` returns deleted items only when the backend supports deleted-file indexing; otherwise it returns an empty list.
- `POST /authentication/dropbox/items/{itemId}/share_link/` returns `{ link }`, reusing an existing Dropbox shared link when present.
- `POST /authentication/dropbox/items/{itemId}/invite/` and `GET /authentication/dropbox/items/{itemId}/permissions/` map Dropbox sharing permissions where the account supports them.
- `POST /files/transfer/dropbox_to_s3/` accepts `{ dropbox_item_id }`.
- `POST /files/transfer/s3_to_dropbox/` accepts `{ s3_file_id }`.

## Pagination

List endpoints return:

```ts
interface DropboxFileListResponse {
  items: DropboxFile[]
  cursor?: string
  hasMore?: boolean
}
```

The frontend wrapper translates this into the same `value` plus next-link pattern used by the OneDrive UI.

## Capability Notes

Favorites are Banbury-managed because Dropbox does not expose a direct OneDrive-style favorite marker for the user file tree. Trash is capability-gated because Dropbox deleted-file listing does not map cleanly to the current UI without backend indexing. Office files are treated as normal binary files and do not need Google Workspace export behavior.
