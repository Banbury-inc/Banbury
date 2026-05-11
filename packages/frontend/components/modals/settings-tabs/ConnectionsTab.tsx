import { Link } from 'lucide-react'
import { XApiConnection } from './XApiConnection'
import { SlackConnection } from './SlackConnection'
import { GitHubConnection } from './GitHubConnection'
import { OutlookConnection } from './OutlookConnection'
import { OneDriveConnection } from './OneDriveConnection'
import { ScopeManager } from './ScopeManager'
import { Typography } from '../../common/ui/typography'
import { Separator } from '../../common/ui/separator'

export function ConnectionsTab() {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Typography variant="h3" className="mb-4 flex items-center text-foreground">
          <Link className="h-5 w-5 mr-2" />
          Connections
        </Typography>
        <ScopeManager 
          onFeatureActivated={() => {}}
        />
      </div>
      <Separator />
      <div className="space-y-4 rounded-lg border border-border bg-muted/30 p-4">
        <XApiConnection />
        <SlackConnection />
        <GitHubConnection />
        <OutlookConnection />
        <OneDriveConnection />
      </div>
    </div>
  )
}

