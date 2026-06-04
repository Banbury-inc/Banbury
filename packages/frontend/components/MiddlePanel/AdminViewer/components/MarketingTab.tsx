import { useState } from 'react'
import Image from 'next/image'
import { Sparkles } from 'lucide-react'
import { Button } from '../../../common/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../common/ui/card'
import {
  handleMarketingCreateClick,
  handleMarketingRunClick,
  type MarketingAssetState,
  type MarketingIdea
} from './handlers/marketingTabHandlers'

export function MarketingTab() {
  const [ideas, setIdeas] = useState<MarketingIdea[]>([])
  const [assetStates, setAssetStates] = useState<Record<string, MarketingAssetState>>({})
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
              <th className="w-1/2 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Description
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Action
              </th>
              <th className="w-48 px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Create
              </th>
            </tr>
          </thead>
          <tbody>
            {ideas.map((idea) => {
              const rowKey = `${idea.description}-${idea.action}`
              const assetState = assetStates[rowKey]
              const isCreating = assetState?.isCreating || false
              const asset = assetState?.result

              return (
                <tr
                  key={rowKey}
                  className="border-b border-zinc-200 transition-colors last:border-b-0 hover:bg-accent/50 dark:border-white/[0.04] dark:hover:bg-accent/50"
                >
                  <td className="px-4 py-3 text-sm text-foreground align-top">
                    <div>{idea.description}</div>
                    {asset && (
                      <div className="mt-3 space-y-3 rounded-lg border border-zinc-200 bg-background p-3 dark:border-white/[0.06]">
                        <div>
                          <div className="text-xs font-medium text-muted-foreground">Post Text</div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{asset.postText}</p>
                        </div>
                        {asset.screenshotPreview && (
                          <Image
                            src={asset.screenshotPreview}
                            alt="Marketing screenshot preview"
                            width={640}
                            height={360}
                            unoptimized
                            className="max-h-56 rounded-md border border-zinc-200 object-cover dark:border-white/[0.06]"
                          />
                        )}
                        {asset.videoPreview && (
                          <video
                            src={asset.videoPreview}
                            controls
                            className="max-h-56 rounded-md border border-zinc-200 dark:border-white/[0.06]"
                          >
                            <track kind="captions" src="" srcLang="en" label="No captions available" />
                          </video>
                        )}
                        {asset.captureUrl && (
                          <div className="text-xs text-muted-foreground">
                            Captured: {asset.captureUrl}
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground align-top">
                    <div>{idea.action}</div>
                    {asset && (
                      <div className="mt-3 space-y-1 text-xs">
                        {asset.screenshotFile && (
                          <div>Screenshot saved: {asset.screenshotFile.file_path}</div>
                        )}
                        {asset.videoFile && (
                          <div>Video saved: {asset.videoFile.file_path}</div>
                        )}
                        {asset.postTextFile && (
                          <div>Text saved: {asset.postTextFile.file_path}</div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleMarketingCreateClick({
                        idea,
                        rowKey,
                        setAssetStates
                      })}
                      disabled={isCreating}
                      className="border-zinc-200 dark:border-white/[0.06]"
                    >
                      {isCreating ? 'Creating' : 'Create'}
                    </Button>
                    {assetState?.error && (
                      <div className="mt-2 text-xs text-destructive">
                        {assetState.error}
                      </div>
                    )}
                    {asset && (
                      <div className="mt-2 text-xs text-muted-foreground">
                        Created
                      </div>
                    )}
                  </td>
                </tr>
              )
            })}
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
