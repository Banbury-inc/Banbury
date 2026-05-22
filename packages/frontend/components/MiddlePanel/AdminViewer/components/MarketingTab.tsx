import { useState } from 'react'
import { Sparkles } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../common/ui/card'
import {
  handleMarketingRunClick,
  type MarketingIdea
} from './handlers/marketingTabHandlers'

export function MarketingTab() {
  const [ideas, setIdeas] = useState<MarketingIdea[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  let content = (
    <div className="rounded-lg border border-dashed border-zinc-200 px-6 py-10 text-center dark:border-white/[0.06]">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="text-sm font-medium text-foreground">No marketing ideas yet</div>
      <div className="mt-1 text-sm text-muted-foreground">
        Click Run to analyze recent commits and populate the table.
      </div>
    </div>
  )

  if (isLoading) {
    content = (
      <div className="flex items-center justify-center py-10 text-muted-foreground">
        <div className="mr-3 h-8 w-8 animate-spin rounded-full border-b-2 border-foreground" />
        Reviewing recent commits for marketable feature updates
      </div>
    )
  }

  if (!isLoading && ideas.length > 0) {
    content = (
      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-white/[0.06]">
        <table className="w-full min-w-full">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-white/[0.06]">
              <th className="w-2/3 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => (
              <tr
                key={`${idea.description}-${idea.action}`}
                className="border-b border-zinc-200 transition-colors last:border-b-0 hover:bg-accent/50 dark:border-white/[0.04] dark:hover:bg-accent/50"
              >
                <td className="px-4 py-3 text-sm text-foreground">
                  {idea.description}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">
                  {idea.action}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  const buttonContent = isLoading ? (
    <>
      <Sparkles className="mr-2 h-4 w-4 animate-pulse" />
      Running
    </>
  ) : 'Run'

  return (
    <div className="space-y-6">
      <Card className="bg-card border-zinc-200 dark:border-white/[0.06]">
        <CardHeader>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-1">
              <CardTitle className="text-foreground">Marketing Ideas</CardTitle>
              <CardDescription className="text-muted-foreground">
                Generate social and email campaign ideas from recent Banbury commits.
              </CardDescription>
            </div>
            <Button
              onClick={() => handleMarketingRunClick({
                setIdeas,
                setError,
                setIsLoading
              })}
              disabled={isLoading}
              className="w-full sm:w-auto"
            >
              {buttonContent}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {content}
        </CardContent>
      </Card>
    </div>
  )
}
