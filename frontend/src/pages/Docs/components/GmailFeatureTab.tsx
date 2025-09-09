import { Box, Typography } from '@mui/material';
import Image from 'next/image';
import gmailImage from '../../../assets/images/gmail.png';

export default function GmailFeatureTab() {
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
        Gmail
      </Typography>
      
      {/* Visibility */}
      <Box sx={{ mb: 4 }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 2,
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          • <strong>Visibility:</strong>
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#a1a1aa',
            mb: 2,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            pl: 2,
          }}
        >
          • Banbury can view and understand the contents of your Gmail messages, including email threads, attachments, and metadata.
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#a1a1aa',
            mb: 2,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            pl: 2,
          }}
        >
          • Access to email content, sender information, timestamps, and conversation threads.
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#a1a1aa',
            mb: 0,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            pl: 2,
          }}
        >
          • Read and analyze email attachments and embedded content.
        </Typography>
      </Box>

      {/* Actions */}
      <Box>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 2,
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          • <strong>Actions - Banbury can:</strong>
        </Typography>
        <Box sx={{ pl: 2 }}>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Compose and send new emails.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Reply to and forward existing emails.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Organize emails by creating and managing labels.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Search and filter emails based on content, sender, or date.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Schedule emails to be sent at specific times.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 1,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Manage email drafts and templates.
          </Typography>
          <Typography
            sx={{
              fontSize: '0.9rem',
              color: '#a1a1aa',
              mb: 0,
              lineHeight: 1.6,
              fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
            }}
          >
            • Set up automated email responses and filters.
          </Typography>
        </Box>
      </Box>

      <Box sx={{ mb: 4, mt: 4 }}>
        <Image
          src={gmailImage}
          alt="Gmail Image"
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
      <Box sx={{
        p: 3,
        mt: 4,
        background: 'rgba(255,255,255,0.02)',
        borderRadius: '20px',
        border: '1px solid rgba(255,255,255,0.08)',
        position: 'relative',
        overflow: 'hidden',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}>
        <Typography
          sx={{
            fontSize: '1rem',
            fontWeight: 600,
            mb: 2,
            color: '#ffffff',
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Gmail Integration
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#a1a1aa',
            mb: 2,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Banbury's Gmail integration allows for seamless email management and automation. Whether you need to analyze email patterns, respond to customer inquiries, or organize your inbox, Banbury can handle it all with intelligent automation.
        </Typography>
        <Typography
          sx={{
            fontSize: '0.9rem',
            color: '#a1a1aa',
            mb: 0,
            lineHeight: 1.6,
            fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          }}
        >
          Connect your Gmail account to get started with intelligent email management powered by AI.
        </Typography>
      </Box>
    </Box>
  );
}
