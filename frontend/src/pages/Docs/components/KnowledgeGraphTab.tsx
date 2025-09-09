import { Box, Typography, Paper } from '@mui/material'
import Image from 'next/image'
import KnowledgeGraphImg from '../../../assets/images/Memories.png'

export default function KnowledgeGraphTab(): JSX.Element {
  return (
    <Box>
      <Typography
        sx={{
          fontSize: { xs: '1.75rem', md: '2rem' },
          fontWeight: 600,
          mb: 3,
          color: '#ffffff',
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Knowledge Graph
      </Typography>

      <Typography
        sx={{
          fontSize: '1rem',
          color: '#a1a1aa',
          mb: 4,
          lineHeight: 1.7,
          fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        Banbury maintains a continuously updating knowledge graph that models entities, relationships, and events across your organization’s data. It enables precise retrieval, reasoning, and traceability for business questions and automations.
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
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 2,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Core capabilities
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            • Entity and relationship extraction from docs, spreadsheets, emails, and the web
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            • Versioned facts with timestamps and sources for auditability
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            • Graph-aware retrieval for precise answers and grounded summaries
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>
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
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 2,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Typical workflows
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            1. Connect data sources → Banbury ingests and extracts entities/relations
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            2. Ask questions → Responses cite nodes, edges, and supporting documents
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>
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
        <Typography
          sx={{
            fontSize: '1.25rem',
            fontWeight: 600,
            color: '#ffffff',
            mb: 2,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Example prompts
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            • Show relationships between Acme Corp, its subsidiaries, and Q2 contracts
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 1, lineHeight: 1.6 }}>
            • What customers are at risk given outages in Region A in the last 14 days?
          </Typography>
          <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', mb: 0, lineHeight: 1.6 }}>
            • Summarize the evidence linking vendor delays to revenue slippage this month
          </Typography>
        </Box>
      </Paper>
    </Box>
  )
}


