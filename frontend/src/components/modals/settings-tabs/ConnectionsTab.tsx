import { Link } from 'lucide-react'
import { XApiConnection } from './XApiConnection'
import { ScopeManager } from './ScopeManager'
import { SlackConnection } from './SlackConnection'

export function ConnectionsTab() {
  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
          <Link className="h-5 w-5 mr-2" />
          Google Integration
        </h2>
        <ScopeManager 
          onFeatureActivated={(feature: string) => {
            console.log(`Feature activated: ${feature}`)
          }}
        />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
          <Link className="h-5 w-5 mr-2" />
          Slack Integration
        </h2>
        <SlackConnection />
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold mb-4 flex items-center text-zinc-900 dark:text-white">
          <Link className="h-5 w-5 mr-2" />
          X (Twitter) Integration
        </h2>
        <XApiConnection />
      </div>
    </div>
  )
}

