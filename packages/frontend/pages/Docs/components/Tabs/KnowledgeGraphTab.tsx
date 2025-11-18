import { Box, Paper } from '@mui/material'
import Image from 'next/image'
import KnowledgeGraphImg from '../../../../assets/images/Memories.png'
import DocPageLayout from '../DocPageLayout'
import { Typography } from '../../../../components/ui/typography'

export default function KnowledgeGraphTab(): JSX.Element {
  return (
    <DocPageLayout>
      <Box>
      <Typography variant="h2" className="mb-3">
        Knowledge Graph
      </Typography>

      <Typography variant="p" className="mb-4">
        Banbury maintains a continuously updating knowledge graph that models entities, relationships, and events across your organization's data. It enables precise retrieval, reasoning, and traceability for business questions and automations.
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Image
          src={KnowledgeGraphImg}
          alt="Knowledge graph visualization"
          style={{
            width: '100%',
            height: 'auto',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            backgroundColor: '#0f0f0f'
          }}
          priority
        />
      </Box>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">
          Core capabilities
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            • Entity and relationship extraction from docs, spreadsheets, emails, and the web
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Versioned facts with timestamps and sources for auditability
          </Typography>
          <Typography variant="muted" className="mb-1">
            • Graph-aware retrieval for precise answers and grounded summaries
          </Typography>
          <Typography variant="muted">
            • Reasoning over multi-hop relationships to surface non-obvious insights
          </Typography>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">
          Typical workflows
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            1. Connect data sources → Banbury ingests and extracts entities/relations
          </Typography>
          <Typography variant="muted" className="mb-1">
            2. Ask questions → Responses cite nodes, edges, and supporting documents
          </Typography>
          <Typography variant="muted">
            3. Act on insights → Trigger tasks and automations grounded in graph facts
          </Typography>
        </Box>
      </Paper>

      <Paper
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography variant="h3" className="mb-2">
          Example prompts
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography variant="muted" className="mb-1">
            • Show relationships between Acme Corp, its subsidiaries, and Q2 contracts
          </Typography>
          <Typography variant="muted" className="mb-1">
            • What customers are at risk given outages in Region A in the last 14 days?
          </Typography>
          <Typography variant="muted">
            • Summarize the evidence linking vendor delays to revenue slippage this month
          </Typography>
        </Box>
      </Paper>
      </Box>
    </DocPageLayout>
  )
}
