import { Box, Typography, Paper } from '@mui/material'
import Image from 'next/image'
import MemoriesImg from '../../../assets/images/Memories.png'

export default function MemoriesTab() {
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
        Memories
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
        Banbury agents are conceptualized with memories, a feedback system that collects and remembers historical conversations to optimize their responses and behavior.
      </Typography>

      <Paper
        sx={{
          p: 3,
          mb: 4,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>
          Why it matters
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', lineHeight: 1.6 }}>
          This systematic approach to gathering and using conversation history allows the agent to continuously evolve, making real-time adjustments to better serve your needs while maintaining a historical record of improvements and trends.
        </Typography>
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
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>
          Defaults and control
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', lineHeight: 1.6 }}>
          By default, Banbury agents do not store conversation history, giving you the choice to enable memory features for your agent.
        </Typography>
      </Paper>

      <Paper
        sx={{
          p: 3,
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '12px',
        }}
      >
        <Typography sx={{ fontSize: '1.25rem', fontWeight: 600, color: '#ffffff', mb: 2 }}>
          Architecture
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', lineHeight: 1.6, mb: 2 }}>
          Banbury leverages an advanced knowledge graph structure to organize and interconnect memories, enabling more intelligent retrieval and contextual understanding.
        </Typography>
        <Typography sx={{ fontSize: '0.95rem', color: '#a1a1aa', lineHeight: 1.6 }}>
          Learn more about Agents in Banbury!
        </Typography>
      </Paper>
    </Box>
  )
}


