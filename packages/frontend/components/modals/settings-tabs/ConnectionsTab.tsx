import { useCallback, useState, type Dispatch, type SetStateAction } from 'react'
import { ChevronRight, Link, User } from 'lucide-react'
import { XApiConnection } from './XApiConnection'
import { SlackConnection } from './SlackConnection'
import { GitHubConnection } from './GitHubConnection'
import { OutlookConnection, TeamsConnection } from './OutlookConnection'
import { OneDriveConnection } from './OneDriveConnection'
import { DropboxConnection } from './DropboxConnection'
import { NotionConnection } from './NotionConnection'
import { GoogleScopeConnection } from './GoogleScopeConnection'
import { ConnectionDetailPanel } from './ConnectionDetailPanel'
import { connectionDetails, getConnectionDetail, type ConnectionId } from './connection-details'
import {
  handleBackToConnectionsList,
  handleConnectionRowClick,
  handleConnectionRowKeyDown,
} from './handlers/connectionSelectionHandlers'
import {
  updateCachedConnectionStatus,
  updateCachedGoogleScopeStatus,
  type GoogleScopeStatuses,
  type ConnectionStatuses,
} from './handlers/connectionStatusStateHandlers'
import { GmailIcon, GoogleCalendarIcon, GoogleDriveIcon } from '../../icons'
import { Typography } from '../../common/ui/typography'
import { Separator } from '../../common/ui/separator'
import { cn } from '../../../utils'

interface RenderConnectionActionParams {
  connectionId: ConnectionId
  connectionStatuses: ConnectionStatuses
  shouldLoadStatus: boolean
  onConnectionStatusChange: <ConnectionKey extends keyof Omit<ConnectionStatuses, 'googleScopes'>>(
    connectionId: ConnectionKey,
    status: NonNullable<ConnectionStatuses[ConnectionKey]>
  ) => void
  onGoogleScopeStatusChange: (featureKey: keyof GoogleScopeStatuses, isAvailable: boolean) => void
}

function renderConnectionAction({
  connectionId,
  connectionStatuses,
  shouldLoadStatus,
  onConnectionStatusChange,
  onGoogleScopeStatusChange,
}: RenderConnectionActionParams) {
  switch (connectionId) {
    case 'profile-information':
      return (
        <GoogleScopeConnection
          featureKey="profile"
          name="Profile Information"
          icon={<User className="h-5 w-5 text-primary" />}
          cachedIsAvailable={connectionStatuses.googleScopes?.profile}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(isAvailable) => onGoogleScopeStatusChange('profile', isAvailable)}
        />
      )
    case 'google-drive':
      return (
        <GoogleScopeConnection
          featureKey="drive"
          name="Google Drive"
          icon={<GoogleDriveIcon size={20} />}
          cachedIsAvailable={connectionStatuses.googleScopes?.drive}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(isAvailable) => onGoogleScopeStatusChange('drive', isAvailable)}
        />
      )
    case 'gmail':
      return (
        <GoogleScopeConnection
          featureKey="gmail"
          name="Gmail"
          icon={<GmailIcon size={20} />}
          cachedIsAvailable={connectionStatuses.googleScopes?.gmail}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(isAvailable) => onGoogleScopeStatusChange('gmail', isAvailable)}
        />
      )
    case 'google-calendar':
      return (
        <GoogleScopeConnection
          featureKey="calendar"
          name="Google Calendar"
          icon={<GoogleCalendarIcon size={20} />}
          cachedIsAvailable={connectionStatuses.googleScopes?.calendar}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(isAvailable) => onGoogleScopeStatusChange('calendar', isAvailable)}
        />
      )
    case 'x':
      return (
        <XApiConnection
          cachedConnectionStatus={connectionStatuses.x}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('x', status)}
        />
      )
    case 'slack':
      return (
        <SlackConnection
          cachedConnectionStatus={connectionStatuses.slack}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('slack', status)}
        />
      )
    case 'github':
      return (
        <GitHubConnection
          cachedConnectionStatus={connectionStatuses.github}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('github', status)}
        />
      )
    case 'outlook':
      return (
        <OutlookConnection
          cachedConnectionStatus={connectionStatuses.outlook}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('outlook', status)}
        />
      )
    case 'teams':
      return (
        <TeamsConnection
          cachedConnectionStatus={connectionStatuses.teams ?? connectionStatuses.outlook}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => {
            onConnectionStatusChange('teams', status)
            onConnectionStatusChange('outlook', status)
          }}
        />
      )
    case 'onedrive':
      return (
        <OneDriveConnection
          cachedConnectionStatus={connectionStatuses.onedrive}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('onedrive', status)}
        />
      )
    case 'dropbox':
      return (
        <DropboxConnection
          cachedConnectionStatus={connectionStatuses.dropbox}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('dropbox', status)}
        />
      )
    case 'notion':
      return (
        <NotionConnection
          cachedConnectionStatus={connectionStatuses.notion}
          shouldLoadStatus={shouldLoadStatus}
          onStatusChange={(status) => onConnectionStatusChange('notion', status)}
        />
      )
  }
}

export function ConnectionsTab() {
  const [selectedConnectionId, setSelectedConnectionId] = useState<ConnectionId | null>(null)
  const [connectionStatuses, setConnectionStatuses] = useState<ConnectionStatuses>({})
  const selectedConnection = selectedConnectionId ? getConnectionDetail(selectedConnectionId) : null
  const handleConnectionStatusChange = useCallback(
    <ConnectionKey extends keyof Omit<ConnectionStatuses, 'googleScopes'>>(
      connectionId: ConnectionKey,
      status: NonNullable<ConnectionStatuses[ConnectionKey]>
    ) => updateCachedConnectionStatus({ connectionId, status, setConnectionStatuses }),
    []
  )
  const handleGoogleScopeStatusChange = useCallback(
    (featureKey: keyof GoogleScopeStatuses, isAvailable: boolean) =>
      updateCachedGoogleScopeStatus({ featureKey, isAvailable, setConnectionStatuses }),
    []
  )

  const header = (
    <div className="space-y-4">
      <Typography variant="h3" className="mb-4 flex items-center text-foreground">
        <Link className="h-5 w-5 mr-2" />
        Connections
      </Typography>
    </div>
  )

  return (
    <div className="space-y-6">
      {header}
      <Separator />

      {selectedConnection ? (
        <ConnectionDetailPanel
          connection={selectedConnection}
          connectionAction={renderConnectionAction({
            connectionId: selectedConnection.id,
            connectionStatuses,
            shouldLoadStatus: false,
            onConnectionStatusChange: handleConnectionStatusChange,
            onGoogleScopeStatusChange: handleGoogleScopeStatusChange,
          })}
          onBack={() => handleBackToConnectionsList(setSelectedConnectionId)}
        />
      ) : null}

      <div
        className={cn(
          'space-y-3 rounded-lg border border-border bg-muted/30 p-3',
          selectedConnection ? 'hidden' : 'block'
        )}
      >
        {connectionDetails.map((connection) => (
          <div
            key={connection.id}
            role="button"
            tabIndex={0}
            aria-label={`View ${connection.name} connection details`}
            onClick={(event) => handleConnectionRowClick({ event, connectionId: connection.id, setSelectedConnectionId })}
            onKeyDown={(event) => handleConnectionRowKeyDown({ event, connectionId: connection.id, setSelectedConnectionId })}
            className={cn(
              'group flex w-full cursor-pointer items-center gap-3 rounded-lg border border-transparent bg-card/60 p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 hover:border-border hover:bg-card'
            )}
          >
            <div className="min-w-0 flex-1">
              {renderConnectionAction({
                connectionId: connection.id,
                connectionStatuses,
                shouldLoadStatus: true,
                onConnectionStatusChange: handleConnectionStatusChange,
                onGoogleScopeStatusChange: handleGoogleScopeStatusChange,
              })}
            </div>
            <div
              aria-hidden="true"
              className="flex h-8 w-8 shrink-0 items-center justify-center text-muted-foreground transition-colors group-hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
