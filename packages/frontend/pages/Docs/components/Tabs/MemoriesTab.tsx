import { Card } from '../../../../components/common/ui/card'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function MemoriesTab() {
  return (
    <DocPageLayout>
      <div>
        <Typography variant="h2" className="mb-3">
          Memories
        </Typography>

        <Typography variant="p" className="mb-4">
          Banbury agents are conceptualized with memories, a feedback system that collects and remembers historical conversations to optimize their responses and behavior.
        </Typography>

        <Card className="mb-6 p-6">
          <Typography variant="h3" className="mb-2">
            Why it matters
          </Typography>
          <Typography variant="p">
            This systematic approach to gathering and using conversation history allows the agent to continuously evolve, making real-time adjustments to better serve your needs while maintaining a historical record of improvements and trends.
          </Typography>
        </Card>

        <Card className="mb-6 p-6">
          <Typography variant="h3" className="mb-2">
            Defaults and control
          </Typography>
          <Typography variant="p">
            By default, Banbury agents do not store conversation history, giving you the choice to enable memory features for your agent.
          </Typography>
        </Card>

        <Card className="p-6">
          <Typography variant="h3" className="mb-2">
            Architecture
          </Typography>
          <Typography variant="p" className="mb-2">
            Banbury leverages an advanced knowledge graph structure to organize and interconnect memories, enabling more intelligent retrieval and contextual understanding.
          </Typography>
          <Typography variant="p">
            Learn more about Agents in Banbury!
          </Typography>
        </Card>
      </div>
    </DocPageLayout>
  )
}
