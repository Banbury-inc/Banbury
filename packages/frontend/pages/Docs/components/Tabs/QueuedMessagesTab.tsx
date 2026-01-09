import { Box } from '@mui/material'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function QueuedMessagesTab() {
  return (
    <DocPageLayout>
      <Box>
        <Typography variant="h2" className="mb-3">
          Queued Messages
        </Typography>

        <Typography variant="p" className="mb-4">
          Queued Messages allow you to line up multiple requests for the AI agent while it's already working on a task. This feature enables a more efficient workflow by letting you prepare follow-up instructions without waiting for the current task to complete.
        </Typography>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">How Queued Messages Work</Typography>
          <Typography variant="p" className="mb-3">
            When the AI agent is running a task, you can continue typing new messages. These messages are added to a queue and will be sent automatically when the current task completes.
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Type your message while the agent is working</Typography>
            <Typography variant="p" className="mb-1">• Press Enter or click Send to add it to the queue</Typography>
            <Typography variant="p" className="mb-1">• Messages are displayed in a collapsible list above the composer</Typography>
            <Typography variant="p">• When the current task finishes, the next queued message is sent automatically</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Queue Display</Typography>
          <Typography variant="p" className="mb-3">
            Queued messages appear in a dedicated section above the composer:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Shows the count of queued messages (e.g., "3 Queued Messages")</Typography>
            <Typography variant="p" className="mb-1">• Click to expand or collapse the message list</Typography>
            <Typography variant="p" className="mb-1">• Each message shows its position in the queue (#1, #2, etc.)</Typography>
            <Typography variant="p">• Messages are truncated for display but full text is shown on hover</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Managing the Queue</Typography>
          <Typography variant="p" className="mb-3">
            You have full control over your queued messages:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1"><strong>Remove a Message:</strong></Typography>
            <Typography variant="p" className="mb-2 pl-4">• Hover over any message and click the X button to remove it from the queue</Typography>
            <Typography variant="p" className="mb-1"><strong>Move to Front:</strong></Typography>
            <Typography variant="p" className="mb-2 pl-4">• Hover over any message (except #1) and click the up arrow to move it to the front of the queue</Typography>
            <Typography variant="p" className="mb-1"><strong>Send Next Immediately:</strong></Typography>
            <Typography variant="p" className="pl-4">• Press Enter with an empty composer to interrupt the current task and send the next queued message</Typography>
          </Box>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Interrupting the Agent</Typography>
          <Typography variant="p" className="mb-3">
            If you need to send the next queued message before the current task completes:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">1. Make sure the composer input is empty</Typography>
            <Typography variant="p" className="mb-1">2. Press Enter to interrupt the current task</Typography>
            <Typography variant="p">3. The next queued message will be sent immediately</Typography>
          </Box>
          <Typography variant="p" className="mt-3">
            Alternatively, you can click the "Send Next" button that appears when the agent is running with queued messages waiting.
          </Typography>
        </Box>

        <Box sx={{ mb: 6 }}>
          <Typography variant="h3" className="mb-2">Use Cases</Typography>
          <Typography variant="p" className="mb-3">
            Queued messages are particularly useful for:
          </Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• <strong>Multi-step workflows:</strong> Queue all the steps of a process upfront</Typography>
            <Typography variant="p" className="mb-1">• <strong>Corrections:</strong> Queue a follow-up correction while waiting for the first task</Typography>
            <Typography variant="p" className="mb-1">• <strong>Chained tasks:</strong> Line up related tasks to run sequentially</Typography>
            <Typography variant="p">• <strong>Batch operations:</strong> Queue multiple similar requests to process one after another</Typography>
          </Box>
        </Box>

        <Box>
          <Typography variant="h3" className="mb-2">Tips</Typography>
          <Box sx={{ pl: 2 }}>
            <Typography variant="p" className="mb-1">• Messages are sent in order, so plan your queue accordingly</Typography>
            <Typography variant="p" className="mb-1">• Each message creates a new conversation turn after the previous completes</Typography>
            <Typography variant="p" className="mb-1">• The agent maintains context between queued messages</Typography>
            <Typography variant="p">• You can continue adding messages to the queue at any time during execution</Typography>
          </Box>
        </Box>
      </Box>
    </DocPageLayout>
  )
}
