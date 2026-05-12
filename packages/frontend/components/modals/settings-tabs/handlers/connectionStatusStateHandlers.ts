import type { Dispatch, SetStateAction } from 'react'
import type { DropboxConnectionStatus } from '../../../handlers/dropbox-connection'
import type { GitHubConnectionStatus } from '../../../handlers/github-connection'
import type { NotionConnectionStatus } from '../../../handlers/notion-connection'
import type { OneDriveConnectionStatus } from '../../../handlers/onedrive-connection'
import type { OutlookConnectionStatus } from '../../../handlers/outlook-connection'
import type { SlackConnectionStatus } from '../../../handlers/slack-connection'
import type { XApiConnectionStatus } from '../../../handlers/x-api-connection'

export interface GoogleScopeStatuses {
  profile?: boolean
  drive?: boolean
  gmail?: boolean
  calendar?: boolean
}

export interface ConnectionStatuses {
  slack?: SlackConnectionStatus
  github?: GitHubConnectionStatus
  outlook?: OutlookConnectionStatus
  teams?: OutlookConnectionStatus
  x?: XApiConnectionStatus
  onedrive?: OneDriveConnectionStatus
  dropbox?: DropboxConnectionStatus
  notion?: NotionConnectionStatus
  googleScopes?: GoogleScopeStatuses
}

interface UpdateCachedConnectionStatusParams<ConnectionKey extends keyof Omit<ConnectionStatuses, 'googleScopes'>> {
  connectionId: ConnectionKey
  status: NonNullable<ConnectionStatuses[ConnectionKey]>
  setConnectionStatuses: Dispatch<SetStateAction<ConnectionStatuses>>
}

interface UpdateCachedGoogleScopeStatusParams {
  featureKey: keyof GoogleScopeStatuses
  isAvailable: boolean
  setConnectionStatuses: Dispatch<SetStateAction<ConnectionStatuses>>
}

export function updateCachedConnectionStatus<ConnectionKey extends keyof Omit<ConnectionStatuses, 'googleScopes'>>({
  connectionId,
  status,
  setConnectionStatuses,
}: UpdateCachedConnectionStatusParams<ConnectionKey>) {
  setConnectionStatuses((currentStatuses) => ({
    ...currentStatuses,
    [connectionId]: status,
  }))
}

export function updateCachedGoogleScopeStatus({
  featureKey,
  isAvailable,
  setConnectionStatuses,
}: UpdateCachedGoogleScopeStatusParams) {
  setConnectionStatuses((currentStatuses) => ({
    ...currentStatuses,
    googleScopes: {
      ...currentStatuses.googleScopes,
      [featureKey]: isAvailable,
    },
  }))
}
