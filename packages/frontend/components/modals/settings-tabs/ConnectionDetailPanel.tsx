import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Badge } from '../../common/ui/badge'
import { Button } from '../../common/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../common/ui/card'
import { Separator } from '../../common/ui/separator'
import { Typography } from '../../common/ui/typography'
import type { ConnectionMetadata } from './connection-details'

interface ConnectionDetailPanelProps {
  connection: ConnectionMetadata
  connectionAction: ReactNode
  onBack: () => void
}

export function ConnectionDetailPanel({
  connection,
  connectionAction,
  onBack,
}: ConnectionDetailPanelProps) {
  const hasTools = connection.tools.length > 0
  const hasPreferences = connection.preferenceKeys.length > 0

  return (
    <div className="space-y-4">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        className="w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to connections
      </Button>

      <Card className="border-border bg-card">
        <CardHeader className="space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="secondary" className="w-fit">
                {connection.category}
              </Badge>
              <CardTitle className="text-xl text-foreground">{connection.name}</CardTitle>
            </div>
            <Badge variant={hasTools ? 'default' : 'outline'}>
              {hasTools ? 'Assistant tools' : 'Connection only'}
            </Badge>
          </div>
          <CardDescription>{connection.description}</CardDescription>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            {connectionAction}
          </div>
        </CardHeader>

        <CardContent className="space-y-5">
          <section className="space-y-3">
            <Typography variant="small" className="text-foreground">
              Capabilities
            </Typography>
            <ul className="space-y-2">
              {connection.capabilities.map((capability) => (
                <li key={capability} className="flex gap-2 text-sm text-muted-foreground">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                  <span>{capability}</span>
                </li>
              ))}
            </ul>
          </section>

          <Separator />

          <section className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Typography variant="small" className="text-foreground">
                Available Tools
              </Typography>
              <Badge variant="outline">{connection.tools.length} tools</Badge>
            </div>

            {hasTools ? (
              <div className="space-y-2">
                {connection.tools.map((tool) => (
                  <div key={tool.name} className="rounded-md border border-border bg-muted/40 p-3">
                    <Typography variant="xs" className="font-semibold text-foreground">
                      {tool.name}
                    </Typography>
                    <Typography variant="muted" className="mt-1 text-xs text-muted-foreground">
                      {tool.description}
                    </Typography>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-md border border-dashed border-border bg-muted/30 p-4">
                <Typography variant="small" className="text-muted-foreground">
                  This connection does not currently expose dedicated assistant tools in the composer.
                </Typography>
              </div>
            )}
          </section>

          <Separator />

          <section className="space-y-3">
            <Typography variant="small" className="text-foreground">
              Setup Notes
            </Typography>
            <div className="space-y-2">
              {connection.setupNotes.map((note) => (
                <Typography key={note} variant="muted" className="text-xs text-muted-foreground">
                  {note}
                </Typography>
              ))}
              {hasPreferences ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {connection.preferenceKeys.map((preferenceKey) => (
                    <Badge key={preferenceKey} variant="outline">
                      {preferenceKey}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}
