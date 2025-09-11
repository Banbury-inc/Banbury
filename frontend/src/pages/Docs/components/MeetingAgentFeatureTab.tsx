import { Box, Typography } from '@mui/material';
import meetingsImage from '../../../assets/images/meetings.png';

export default function MeetingAgentFeatureTab() {
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
       Meetings 
      </Typography>
      
      
      {/* Overview */}
      <Box sx={{ mb: 4 }}>
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
          Banbury's Meeting Agent provides intelligent meeting recording and transcription powered by Recall AI integration. It features an automated meeting bot that can join video calls and capture comprehensive meeting data, along with real-time meeting management capabilities such as participant tracking and session monitoring.
        </Typography>
      </Box>

      {/* Meeting Agent Image */}
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={meetingsImage.src}
          alt="Meeting Agent Interface"
          sx={{
            maxWidth: '100%',
            height: 'auto',
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        />
      </Box>
      {/* Core Features */}
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
          • <strong>Core Features:</strong>
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
            • <strong>Meeting Join:</strong> Automatically join video calls from multiple platforms (Zoom, Teams, Google Meet, etc.)
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
            • <strong>Real-time Recording:</strong> High-quality video and audio recording with live status indicators
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
            • <strong>Live Transcription:</strong> Real-time speech-to-text conversion with speaker identification
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
            • <strong>Participant Tracking:</strong> Monitor who joins/leaves meetings with detailed participant information
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
            • <strong>Session Management:</strong> View, manage, and control multiple meeting sessions simultaneously
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
            • <strong>Cloud Storage:</strong> Automatic upload to S3 with secure cloud backup and retrieval
          </Typography>
        </Box>
      </Box>

      {/* Meeting Management */}
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
          • <strong>Meeting Management - Banbury can:</strong>
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
            • Join meetings automatically using meeting URLs from various platforms
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
            • Start and stop recording sessions with one-click controls
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
            • Leave meetings gracefully and trigger automatic data processing
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
            • Monitor meeting status in real-time (active, recording, completed, failed)
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
            • Bulk manage multiple sessions (delete, refresh, upload to cloud)
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
            • Update session URLs and metadata automatically from bot responses
          </Typography>
        </Box>
      </Box>

      {/* Data Processing */}
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
          • <strong>Data Processing & Storage:</strong>
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
            • <strong>Video Processing:</strong> High-quality video recording with automatic compression and optimization
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
            • <strong>Transcription Analysis:</strong> AI-powered speech recognition with speaker identification and confidence scoring
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
            • <strong>Cloud Integration:</strong> Automatic S3 upload with secure access controls and URL generation
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
            • <strong>Metadata Extraction:</strong> Meeting duration, participant details, platform information, and timestamps
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
            • <strong>Search & Retrieval:</strong> Full-text search across transcripts with timestamp-based navigation
          </Typography>
        </Box>
      </Box>

      {/* User Interface */}
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
          • <strong>User Interface Features:</strong>
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
            • <strong>Dashboard View:</strong> Comprehensive meeting overview with real-time status updates
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
            • <strong>Expandable Rows:</strong> Detailed meeting information with video player and transcript viewer
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
            • <strong>Bulk Operations:</strong> Select and manage multiple sessions simultaneously
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
            • <strong>Real-time Updates:</strong> Live refresh capabilities with loading states and error handling
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
            • <strong>Responsive Design:</strong> Mobile-first interface that works across all devices
          </Typography>
        </Box>
      </Box>

      {/* Integration Benefits */}
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
          Meeting Agent Integration
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
          Banbury's Meeting Agent transforms how you capture and analyze meeting content. With seamless integration across all major video conferencing platforms, intelligent transcription, and automated cloud storage, you'll never miss important meeting details again.
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
          The system automatically handles the entire meeting lifecycle - from joining calls and recording content to processing transcripts and storing everything securely in the cloud. This enables powerful search, analysis, and knowledge extraction from your meeting data.
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
          Start recording your meetings with intelligent automation and never lose track of important discussions, decisions, or action items again.
        </Typography>
      </Box>
    </Box>
  );
}
