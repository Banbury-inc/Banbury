import { Link } from 'lucide-react'
import { XApiConnection } from './XApiConnection'
import { SlackConnection } from './SlackConnection'
import { GitHubConnection } from './GitHubConnection'
import { ScopeManager } from './ScopeManager'

export function ConnectionsTab() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
          <Link className="h-5 w-5 mr-2" />
         Connections 
        </h2>
        <ScopeManager 
          onFeatureActivated={(feature: string) => {
            console.log(`Feature activated: ${feature}`)
          }}
        />
      </div>
      <div className="space-y-4">
        <XApiConnection />
      </div>

      <div className="space-y-4">
        <SlackConnection />
      </div>

      <div className="space-y-4">
        <GitHubConnection />
      </div>
    </div>
  )
}

