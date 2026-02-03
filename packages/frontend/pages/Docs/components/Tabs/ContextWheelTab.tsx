import { Box } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/common/ui/typography'

export default function ContextWheelTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          Context Wheel (Context Budget Meter)
        </Typography>

        <Typography variant="p" className="mb-4">
          The context wheel helps you understand how much information is being sent to the model in your next message. It reflects the total context budget, what's already used, and what's reserved for the model's output.
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">What it is</Typography>
          <Typography variant="p">
            A small meter next to the composer send button that shows your current context usage. Hover it to see details about used tokens, remaining tokens, and output tokens reserved for the response.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">How to use it</Typography>
          <Typography variant="list">
            <li>If the wheel is close to full, the model may have less room to incorporate new information</li>
            <li>Treat it as a warning sign to simplify your next message or reduce attachments</li>
            <li>If you need a large, high-quality response, leave room for reserved output tokens</li>
          </Typography>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">How to reduce context usage</Typography>
          <Typography variant="list">
            <li>Send shorter messages and avoid repeating background that's already established</li>
            <li>Attach fewer files at once (or only the most relevant excerpt)</li>
            <li>Split large tasks into smaller steps across multiple messages</li>
            <li>Start a fresh thread when a topic changes significantly</li>
          </Typography>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
